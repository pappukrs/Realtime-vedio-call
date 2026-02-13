import { Socket, Server } from 'socket.io';
import { logger } from 'common';
import { mediaGrpcClient } from '../grpc-client.js';

export const handleWebRTC = (socket: Socket, io: Server) => {
    socket.on('getRouterRtpCapabilities', async ({ roomId }, callback) => {
        try {
            const response: any = await mediaGrpcClient.GetRouterRtpCapabilities({ roomId });
            callback({ rtpCapabilities: JSON.parse(response.rtpCapabilities) });
        } catch (error: any) {
            logger.error('getRouterRtpCapabilities error:', error.message);
            callback({ error: error.message });
        }
    });

    socket.on('createWebRtcTransport', async ({ roomId, direction }, callback) => {
        try {
            const response: any = await mediaGrpcClient.CreateWebRtcTransport({ roomId, direction });
            callback({ params: JSON.parse(response.params) });
        } catch (error: any) {
            logger.error('createWebRtcTransport error:', error.message);
            callback({ error: error.message });
        }
    });

    socket.on('connectWebRtcTransport', async ({ transportId, dtlsParameters }, callback) => {
        try {
            await mediaGrpcClient.ConnectWebRtcTransport({
                transportId,
                dtlsParameters: JSON.stringify(dtlsParameters)
            });
            callback();
        } catch (error: any) {
            logger.error('connectWebRtcTransport error:', error.message);
            callback({ error: error.message });
        }
    });

    socket.on('produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
        try {
            const enrichedAppData = { ...appData, userId: socket.id };

            const response: any = await mediaGrpcClient.Produce({
                transportId,
                kind,
                rtpParameters: JSON.stringify(rtpParameters),
                appData: JSON.stringify(enrichedAppData)
            });

            logger.info(`Producer ${response.id} (${kind}) created for user ${socket.id} in room ${appData.roomId}`);
            callback({ id: response.id });

            // Broadcast new producer to others in room
            if (appData.roomId) {
                logger.info(`Broadcasting newProducer ${response.id} to room ${appData.roomId}`);
                socket.to(appData.roomId).emit('newProducer', {
                    producerId: response.id,
                    userId: socket.id,
                    appData: enrichedAppData
                });
            } else {
                logger.warn(`Cannot broadcast newProducer ${response.id}: roomId is missing in appData`);
            }
        } catch (error: any) {
            logger.error('produce error:', error.message);
            callback({ error: error.message });
        }
    });

    socket.on('consume', async ({ roomId, transportId, producerId, rtpCapabilities }, callback) => {
        try {
            const response: any = await mediaGrpcClient.Consume({
                roomId,
                transportId,
                producerId,
                rtpCapabilities: JSON.stringify(rtpCapabilities)
            });
            callback({ params: JSON.parse(response.params) });
        } catch (error: any) {
            logger.error('consume error:', error.message);
            callback({ error: error.message });
        }
    });

    socket.on('resumeConsumer', async ({ consumerId }, callback) => {
        try {
            await mediaGrpcClient.ResumeConsumer({ consumerId });
            if (callback) callback();
        } catch (error: any) {
            logger.error('resumeConsumer error:', error.message);
            if (callback) callback({ error: error.message });
        }
    });

    socket.on('getProducers', async ({ roomId }, callback) => {
        try {
            const response: any = await mediaGrpcClient.GetProducers({ roomId });
            if (callback) callback({ producers: JSON.parse(response.producers) || [] });
        } catch (error: any) {
            logger.error('getProducers error:', error.message);
            if (callback) callback({ producers: [] });
        }
    });

    socket.on('producerClosed', async ({ producerId, roomId }) => {
        try {
            await mediaGrpcClient.CloseProducer({ producerId, roomId });
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

    socket.on('pauseProducer', async ({ producerId, roomId, kind }) => {
        try {
            await mediaGrpcClient.PauseProducer({ producerId, roomId });
            // Explicitly broadcast to others with kind
            if (roomId) {
                socket.to(roomId).emit('producerPaused', { producerId, userId: socket.id, kind });
            }
        } catch (error: any) {
            logger.error('pauseProducer error:', error.message);
        }
    });

    socket.on('resumeProducer', async ({ producerId, roomId, kind }) => {
        try {
            await mediaGrpcClient.ResumeProducer({ producerId, roomId });
            // Explicitly broadcast to others with kind
            if (roomId) {
                socket.to(roomId).emit('producerResumed', { producerId, userId: socket.id, kind });
            }
        } catch (error: any) {
            logger.error('resumeProducer error:', error.message);
        }
    });

    socket.on('disconnect', async () => {
        logger.info(`Final cleanup for user ${socket.id}`);
    });
};
