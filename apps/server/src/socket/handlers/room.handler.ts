import { Socket } from 'socket.io';
import { addParticipantToRoom, removeParticipantFromRoom } from '../../services/room.service.js';
import { logger } from '../../utils/logger.js';

export const handleRoom = (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    socket.on('joinRoom', async ({ roomId, userId, userName }, callback) => {
        try {
            logger.info(`User ${userId} (${userName || 'Anonymous'}) joining room ${roomId}`);

            socket.join(roomId);
            await addParticipantToRoom(roomId, userId, userName);

            currentRoomId = roomId;
            currentUserId = userId;

            if (callback) callback();

            // Notify others in the room with the user's name
            const roomSockets = await socket.in(roomId).fetchSockets();
            logger.info(`Broadcasting userJoined to ${roomSockets.length} other participants in room ${roomId}`);
            socket.to(roomId).emit('userJoined', { userId, userName });
        } catch (error: any) {
            logger.error('joinRoom error:', error);
            if (callback) callback({ error: error.message });
        }
    });

    socket.on('leaveRoom', async ({ roomId, userId }) => {
        try {
            logger.info(`User ${userId} leaving room ${roomId}`);

            socket.leave(roomId);
            await removeParticipantFromRoom(roomId, userId);

            currentRoomId = null;
            currentUserId = null;

            // Notify others in the room
            socket.to(roomId).emit('userLeft', { userId });
        } catch (error: any) {
            logger.error('leaveRoom error:', error);
        }
    });

    socket.on('disconnect', async () => {
        if (currentRoomId && currentUserId) {
            logger.info(`Cleanup: User ${currentUserId} disconnected from room ${currentRoomId}`);
            await removeParticipantFromRoom(currentRoomId, currentUserId);
            socket.to(currentRoomId).emit('userLeft', { userId: currentUserId });
        }
    });
};
