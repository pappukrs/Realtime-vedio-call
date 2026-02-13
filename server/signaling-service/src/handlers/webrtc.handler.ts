import { Socket, Server } from 'socket.io';
import axios from 'axios';
import { logger } from 'common';

const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || 'http://media-service:6000';

export const handleWebRTC = (socket: Socket, io: Server) => {
    socket.on('getRouterRtpCapabilities', async ({ roomId }, callback) => {
        try {
            const response = await axios.post(`${MEDIA_SERVICE_URL}/rooms/${roomId}/router-capabilities`);
            callback({ rtpCapabilities: response.data.rtpCapabilities });
        } catch (error: any) {
            logger.error('getRouterRtpCapabilities error:', error.message);
            callback({ error: error.message });
        }
    });

    socket.on('createWebRtcTransport', async ({ roomId, direction }, callback) => {
        try {
            const response = await axios.post(`${MEDIA_SERVICE_URL}/rooms/${roomId}/transports`, { direction });
            callback(response.data);
        } catch (error: any) {
            logger.error('createWebRtcTransport error:', error.message);
            callback({ error: error.message });
        }
    });

    socket.on('connectWebRtcTransport', async ({ transportId, dtlsParameters }, callback) => {
        try {
            await axios.post(`${MEDIA_SERVICE_URL}/transports/${transportId}/connect`, { dtlsParameters });
            callback();
        } catch (error: any) {
            logger.error('connectWebRtcTransport error:', error.message);
            callback({ error: error.message });
        }
    });

    socket.on('produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
        try {
            // Always include the socket.id as the userId so media-service can track ownership
            const enrichedAppData = { ...appData, userId: socket.id };

            const response = await axios.post(`${MEDIA_SERVICE_URL}/transports/${transportId}/produce`, {
                kind, rtpParameters, appData: enrichedAppData
            });
            callback(response.data);

            // Broadcast new producer to others in room
            socket.to(appData.roomId).emit('newProducer', {
                producerId: response.data.id,
                userId: socket.id,
                appData: enrichedAppData
            });
        } catch (error: any) {
            logger.error('produce error:', error.message);
            callback({ error: error.message });
        }
    });

    socket.on('consume', async ({ roomId, transportId, producerId, rtpCapabilities }, callback) => {
        try {
            const response = await axios.post(`${MEDIA_SERVICE_URL}/rooms/${roomId}/consume`, {
                transportId, producerId, rtpCapabilities
            });
            callback(response.data);
        } catch (error: any) {
            logger.error('consume error:', error.message);
            callback({ error: error.message });
        }
    });

    socket.on('resumeConsumer', async ({ consumerId }, callback) => {
        try {
            await axios.post(`${MEDIA_SERVICE_URL}/consumers/${consumerId}/resume`);
            if (callback) callback();
        } catch (error: any) {
            logger.error('resumeConsumer error:', error.message);
            if (callback) callback({ error: error.message });
        }
    });

    // Get all existing producers in a room (for late joiners)
    socket.on('getProducers', async ({ roomId }, callback) => {
        try {
            const response = await axios.get(`${MEDIA_SERVICE_URL}/rooms/${roomId}/producers`);
            if (callback) callback({ producers: response.data.producers || [] });
        } catch (error: any) {
            logger.error('getProducers error:', error.message);
            if (callback) callback({ producers: [] });
        }
    });

    socket.on('producerClosed', async ({ producerId, roomId }) => {
        try {
            await axios.post(`${MEDIA_SERVICE_URL}/producers/${producerId}/close`);

            // Broadcast to all peers in the room so they can clean up consumers
            if (roomId) {
                socket.to(roomId).emit('producerClosed', {
                    producerId,
                    userId: socket.id
                });
            }
        } catch (error: any) {
            logger.error('producerClosed error:', error.message);
        }
    });

    socket.on('pauseProducer', async ({ producerId, roomId }) => {
        try {
            await axios.post(`${MEDIA_SERVICE_URL}/producers/${producerId}/pause`);
            // Optional: Broadcast explicitly if track mute event isn't enough
            // But Mediasoup consumers will fire 'producerpause' automatically
        } catch (error: any) {
            logger.error('pauseProducer error:', error.message);
        }
    });

    socket.on('resumeProducer', async ({ producerId, roomId }) => {
        try {
            await axios.post(`${MEDIA_SERVICE_URL}/producers/${producerId}/resume`);
        } catch (error: any) {
            logger.error('resumeProducer error:', error.message);
        }
    });

    socket.on('disconnect', async () => {
        logger.info(`Final cleanup for user ${socket.id}`);
    });
};
