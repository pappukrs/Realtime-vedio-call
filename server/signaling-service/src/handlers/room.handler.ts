import { Socket, Server } from 'socket.io';
import { logger, pool } from 'common';
import axios from 'axios';

const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || 'http://media-service:6000';

// In-memory participant tracking per room
// Map<roomId, Map<socketId, { userId, userName }>>
const roomParticipants = new Map<string, Map<string, { userId: string; userName: string }>>();

export const getRoomParticipants = (roomId: string) => {
    return roomParticipants.get(roomId);
};

export const handleRoom = (socket: Socket, io: Server) => {
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    socket.on('joinRoom', async ({ roomId, userId, userName }, callback) => {
        try {
            // Validate room exists in DB
            const roomResult = await pool.query('SELECT id FROM rooms WHERE id = $1', [roomId]);
            if (roomResult.rowCount === 0) {
                logger.warn(`User ${userId} tried to join non-existent room ${roomId}`);
                if (callback) callback({ error: 'Room not found' });
                return;
            }

            logger.info(`User ${userId} (${userName}) joining room ${roomId}`);
            socket.join(roomId);

            currentRoomId = roomId;
            currentUserId = userId;

            // Track participant
            if (!roomParticipants.has(roomId)) {
                roomParticipants.set(roomId, new Map());
            }
            roomParticipants.get(roomId)!.set(socket.id, { userId, userName: userName || 'Anonymous' });

            // Build existing participants list for the joiner
            const existingParticipants: { userId: string; userName: string; socketId: string }[] = [];
            const roomMap = roomParticipants.get(roomId)!;
            for (const [sockId, data] of roomMap.entries()) {
                if (sockId !== socket.id) {
                    existingParticipants.push({ userId: data.userId, userName: data.userName, socketId: sockId });
                }
            }

            // Notify others in the room
            socket.to(roomId).emit('userJoined', { userId, userName, socketId: socket.id });

            // Return existing participants to the joiner
            if (callback) callback({ participants: existingParticipants });
        } catch (error: any) {
            logger.error('joinRoom error:', error.message);
            if (callback) callback({ error: error.message });
        }
    });

    socket.on('sendMessage', ({ roomId, recipientId, message, senderName }) => {
        try {
            const timestamp = new Date().toISOString();
            const payload = {
                senderId: socket.id,
                senderName,
                message,
                timestamp,
                isPrivate: !!recipientId
            };

            if (recipientId) {
                socket.to(recipientId).emit('messageReceived', payload);
                socket.emit('messageReceived', payload);
            } else {
                socket.to(roomId).emit('messageReceived', payload);
                socket.emit('messageReceived', payload);
            }
        } catch (error: any) {
            logger.error('sendMessage error:', error.message);
        }
    });

    socket.on('leaveRoom', async ({ roomId, userId }) => {
        try {
            logger.info(`User ${userId} leaving room ${roomId}`);
            socket.leave(roomId);
            socket.to(roomId).emit('userLeft', { userId });

            // Remove from tracking
            const roomMap = roomParticipants.get(roomId);
            if (roomMap) {
                roomMap.delete(socket.id);
                if (roomMap.size === 0) {
                    roomParticipants.delete(roomId);
                }
            }

            // Notify Media Service to cleanup
            await axios.post(`${MEDIA_SERVICE_URL}/rooms/${roomId}/users/${userId}/cleanup`).catch((e: any) => {
                logger.error('Media service cleanup failed on leaveRoom:', e.message);
            });

            currentRoomId = null;
            currentUserId = null;
        } catch (error: any) {
            logger.error('leaveRoom error:', error.message);
        }
    });

    socket.on('disconnect', async () => {
        if (currentRoomId && currentUserId) {
            logger.info(`Cleanup: User ${currentUserId} disconnected from room ${currentRoomId}`);
            socket.to(currentRoomId).emit('userLeft', { userId: currentUserId });

            // Remove from tracking
            const roomMap = roomParticipants.get(currentRoomId);
            if (roomMap) {
                roomMap.delete(socket.id);
                if (roomMap.size === 0) {
                    roomParticipants.delete(currentRoomId);
                }
            }

            // Notify Media Service to cleanup
            await axios.post(`${MEDIA_SERVICE_URL}/rooms/${currentRoomId}/users/${currentUserId}/cleanup`).catch((e: any) => {
                logger.error('Media service cleanup failed on disconnect:', e.message);
            });
        }
    });
};
