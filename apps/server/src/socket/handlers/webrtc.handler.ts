import { Socket } from 'socket.io';
import { getOrCreateRoom, addProducerToRoom, getRoomProducers, removeProducerFromRoom } from '../../services/room.service.js';
import { createWebRtcTransport } from '../../mediasoup/transport.js';
import { logger } from '../../utils/logger.js';

// Use any for types to unblock ESM/TS issues
type WebRtcTransport = any;
type Producer = any;
type Consumer = any;

const transports = new Map<string, WebRtcTransport>();
const producers = new Map<string, Producer>();
const consumers = new Map<string, Consumer>();

// Track resources per socket for cleanup
const socketResources = new Map<string, {
    transports: Set<string>;
    producers: Set<string>;
    consumers: Set<string>;
}>();

export const handleWebRTC = (socket: Socket) => {
    if (!socketResources.has(socket.id)) {
        socketResources.set(socket.id, {
            transports: new Set(),
            producers: new Set(),
            consumers: new Set()
        });
    }

    socket.on('getProducers', ({ roomId }, callback) => {
        const producers = getRoomProducers(roomId);
        callback({ producers });
    });

    socket.on('getRouterRtpCapabilities', async ({ roomId }, callback) => {
        try {
            const room = await getOrCreateRoom(roomId);
            callback({ rtpCapabilities: room.router.rtpCapabilities });
        } catch (error: any) {
            logger.error('getRouterRtpCapabilities error:', error);
            callback({ error: error.message });
        }
    });

    socket.on('createWebRtcTransport', async ({ roomId }, callback) => {
        try {
            const room = await getOrCreateRoom(roomId);
            const transport = await createWebRtcTransport(room.router);

            transports.set(transport.id, transport);
            socketResources.get(socket.id)?.transports.add(transport.id);

            callback({
                params: {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                },
            });
        } catch (error: any) {
            logger.error('createWebRtcTransport error:', error);
            callback({ error: error.message });
        }
    });

    socket.on('connectWebRtcTransport', async ({ transportId, dtlsParameters }, callback) => {
        try {
            const transport = transports.get(transportId);
            if (!transport) throw new Error(`Transport not found: ${transportId}`);

            await transport.connect({ dtlsParameters });
            callback();
        } catch (error: any) {
            logger.error('connectWebRtcTransport error:', error);
            callback({ error: error.message });
        }
    });

    socket.on('produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
        try {
            const transport = transports.get(transportId);
            if (!transport) throw new Error(`Transport not found: ${transportId}`);

            const producer = await transport.produce({ kind, rtpParameters, appData });
            producers.set(producer.id, producer);
            socketResources.get(socket.id)?.producers.add(producer.id);

            producer.on('transportclose', () => {
                logger.info('Producer transport closed');
                producer.close();
                producers.delete(producer.id);
                removeProducerFromRoom(appData.roomId, producer.id);
            });

            callback({ id: producer.id });

            // Store producer in room service
            addProducerToRoom(appData.roomId, producer.id, socket.id);

            // Broadcast new producer to others in room
            socket.to(appData.roomId).emit('newProducer', {
                producerId: producer.id,
                userId: socket.id,
                appData: producer.appData
            });
        } catch (error: any) {
            logger.error('produce error:', error);
            callback({ error: error.message });
        }
    });

    socket.on('consume', async ({ roomId, transportId, producerId, rtpCapabilities }, callback) => {
        try {
            const room = await getOrCreateRoom(roomId);
            const transport = transports.get(transportId);
            const producer = producers.get(producerId);

            if (!transport || !producer) throw new Error('Transport or Producer not found');

            if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities })) {
                throw new Error('Cannot consume');
            }

            const consumer = await transport.consume({
                producerId: producer.id,
                rtpCapabilities,
                paused: true,
            });

            consumers.set(consumer.id, consumer);
            socketResources.get(socket.id)?.consumers.add(consumer.id);

            consumer.on('transportclose', () => {
                consumer.close();
                consumers.delete(consumer.id);
            });

            consumer.on('producerclose', () => {
                consumer.close();
                consumers.delete(consumer.id);
            });

            callback({
                params: {
                    id: consumer.id,
                    producerId: producer.id,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                },
            });
        } catch (error: any) {
            logger.error('consume error:', error);
            callback({ error: error.message });
        }
    });

    socket.on('resumeConsumer', async ({ consumerId }, callback) => {
        try {
            const consumer = consumers.get(consumerId);
            if (!consumer) throw new Error('Consumer not found');

            await consumer.resume();
            if (callback) callback();
        } catch (error: any) {
            logger.error('resumeConsumer error:', error);
            if (callback) callback({ error: error.message });
        }
    });

    socket.on('producerClosed', ({ producerId }) => {
        try {
            const producer = producers.get(producerId);
            if (producer) {
                producer.close();
                producers.delete(producerId);
                // The 'transportclose' or similar might not trigger if closed manually,
                // but let's ensure we cleanup room state.
            }
        } catch (error: any) {
            logger.error('producerClosed error:', error);
        }
    });

    socket.on('disconnect', () => {
        const resources = socketResources.get(socket.id);
        if (resources) {
            logger.info(`Cleaning up WebRTC resources for socket: ${socket.id}`);

            resources.transports.forEach(id => {
                const t = transports.get(id);
                if (t) t.close();
                transports.delete(id);
            });

            resources.producers.forEach(id => {
                const p = producers.get(id);
                if (p) p.close();
                producers.delete(id);
            });

            resources.consumers.forEach(id => {
                const c = consumers.get(id);
                if (c) c.close();
                consumers.delete(id);
            });

            socketResources.delete(socket.id);
        }
    });
};
