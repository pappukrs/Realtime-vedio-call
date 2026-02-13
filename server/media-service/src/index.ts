import express from 'express';
import cors from 'cors';
import { createWorkers, createRouter } from './worker.js';
import { createWebRtcTransport } from './transport.js';
import { logger, register, registerService, httpRequestsTotal, httpRequestDuration } from 'common';
import { startGrpcServer } from './grpc-server.js';

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json());

// In-memory storage for Mediasoup objects (instance specific)
const rooms = new Map<string, any>();
const transports = new Map<string, any>();
const producers = new Map<string, any>();
const consumers = new Map<string, any>();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const labels = {
            method: req.method,
            path: req.path,
            status: res.statusCode.toString(),
        };
        httpRequestsTotal.inc(labels);
        httpRequestDuration.observe(labels, duration);
    });
    next();
});

// --- REST API Endpoints ---

app.post('/rooms/:roomId/router-capabilities', async (req, res) => {
    const { roomId } = req.params;
    try {
        let room = rooms.get(roomId);
        if (!room) {
            const router = await createRouter();
            room = { router, producers: new Map() };
            rooms.set(roomId, room);
        }
        res.json({ rtpCapabilities: room.router.rtpCapabilities });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/rooms/:roomId/transports', async (req, res) => {
    const { roomId } = req.params;
    const { direction } = req.body;
    try {
        const room = rooms.get(roomId);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        const transport = await createWebRtcTransport(room.router);
        transports.set(transport.id, transport);

        res.json({
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/transports/:id/connect', async (req, res) => {
    const { id } = req.params;
    const { dtlsParameters } = req.body;
    try {
        const transport = transports.get(id);
        if (!transport) return res.status(404).json({ error: 'Transport not found' });
        await transport.connect({ dtlsParameters });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/transports/:id/produce', async (req, res) => {
    const { id } = req.params;
    const { kind, rtpParameters, appData } = req.body;
    try {
        const transport = transports.get(id);
        if (!transport) return res.status(404).json({ error: 'Transport not found' });

        const producer = await transport.produce({ kind, rtpParameters, appData });
        producers.set(producer.id, producer);

        const room = rooms.get(appData.roomId);
        if (room) {
            room.producers.set(producer.id, {
                producer,
                userId: appData.userId || 'unknown',
                appData: appData
            });
        }

        res.json({ id: producer.id });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/rooms/:roomId/producers', (req, res) => {
    const { roomId } = req.params;
    try {
        const room = rooms.get(roomId);
        if (!room) return res.json({ producers: [] });

        const producerList: any[] = [];
        for (const [producerId, data] of room.producers.entries()) {
            if (!data.producer.closed) {
                producerList.push({
                    producerId,
                    userId: data.userId,
                    appData: data.appData
                });
            }
        }
        res.json({ producers: producerList });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/rooms/:roomId/consume', async (req, res) => {
    const { roomId } = req.params;
    const { transportId, producerId, rtpCapabilities } = req.body;
    try {
        const room = rooms.get(roomId);
        const transport = transports.get(transportId);
        const producer = producers.get(producerId);

        if (!room || !transport || !producer) return res.status(404).json({ error: 'Resource not found' });

        if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities })) {
            return res.status(400).json({ error: 'Cannot consume' });
        }

        const consumer = await transport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: true,
        });

        consumers.set(consumer.id, consumer);

        res.json({
            params: {
                id: consumer.id,
                producerId: producer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/consumers/:id/resume', async (req, res) => {
    const { id } = req.params;
    try {
        const consumer = consumers.get(id);
        if (!consumer) return res.status(404).json({ error: 'Consumer not found' });
        await consumer.resume();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/producers/:id/close', (req, res) => {
    const { id } = req.params;
    try {
        const producer = producers.get(id);
        if (producer) {
            producer.close();
            producers.delete(id);
            for (const [, room] of rooms.entries()) {
                if (room.producers.has(id)) {
                    room.producers.delete(id);
                    break;
                }
            }
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/producers/:id/pause', async (req, res) => {
    const { id } = req.params;
    try {
        const producer = producers.get(id);
        if (!producer) return res.status(404).json({ error: 'Producer not found' });
        await producer.pause();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/producers/:id/resume', async (req, res) => {
    const { id } = req.params;
    try {
        const producer = producers.get(id);
        if (!producer) return res.status(404).json({ error: 'Producer not found' });
        await producer.resume();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/rooms/:roomId/users/:userId/cleanup', (req, res) => {
    const { roomId, userId } = req.params;
    try {
        const room = rooms.get(roomId);
        if (room) {
            const toDelete: string[] = [];
            for (const [id, data] of room.producers.entries()) {
                if (data.userId === userId) {
                    data.producer.close();
                    toDelete.push(id);
                    producers.delete(id);
                }
            }
            toDelete.forEach(id => room.producers.delete(id));
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- gRPC Server Implementation ---
const grpcHandlers = {
    GetRouterRtpCapabilities: async (call: any, callback: any) => {
        const { roomId } = call.request;
        try {
            let room = rooms.get(roomId);
            if (!room) {
                const router = await createRouter();
                room = { router, producers: new Map() };
                rooms.set(roomId, room);
            }
            callback(null, { rtpCapabilities: JSON.stringify(room.router.rtpCapabilities) });
        } catch (error: any) {
            logger.error(`GetRouterRtpCapabilities error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    },

    CreateWebRtcTransport: async (call: any, callback: any) => {
        const { roomId } = call.request;
        try {
            const room = rooms.get(roomId);
            if (!room) return callback({ code: 5, message: 'Room not found' });

            const transport = await createWebRtcTransport(room.router);
            transports.set(transport.id, transport);

            callback(null, {
                params: JSON.stringify({
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                })
            });
        } catch (error: any) {
            logger.error(`CreateWebRtcTransport error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    },

    ConnectWebRtcTransport: async (call: any, callback: any) => {
        const { transportId, dtlsParameters } = call.request;
        try {
            const transport = transports.get(transportId);
            if (!transport) return callback({ code: 5, message: 'Transport not found' });
            await transport.connect({ dtlsParameters: JSON.parse(dtlsParameters) });
            callback(null, {});
        } catch (error: any) {
            logger.error(`ConnectWebRtcTransport error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    },

    Produce: async (call: any, callback: any) => {
        const { transportId, kind, rtpParameters, appData } = call.request;
        try {
            const transport = transports.get(transportId);
            if (!transport) return callback({ code: 5, message: 'Transport not found' });

            const parsedAppData = JSON.parse(appData);
            const producer = await transport.produce({
                kind,
                rtpParameters: JSON.parse(rtpParameters),
                appData: parsedAppData
            });

            producer.on('score', (score: any) => {
                logger.info(`Producer ${producer.id} score:`, score);
            });

            producers.set(producer.id, producer);

            const room = rooms.get(parsedAppData.roomId);
            if (room) {
                logger.info(`Producer added to room ${parsedAppData.roomId}: ${producer.id} (type: ${parsedAppData.type})`);
                room.producers.set(producer.id, {
                    producer,
                    userId: parsedAppData.userId || 'unknown',
                    appData: parsedAppData
                });
            }

            callback(null, { id: producer.id });
        } catch (error: any) {
            logger.error(`Produce error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    },

    Consume: async (call: any, callback: any) => {
        const { roomId, transportId, producerId, rtpCapabilities } = call.request;
        try {
            const room = rooms.get(roomId);
            const transport = transports.get(transportId);
            const producer = producers.get(producerId);

            if (!room || !transport || !producer) {
                return callback({ code: 5, message: 'Resource not found' });
            }

            const parsedRtpCaps = JSON.parse(rtpCapabilities);
            if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities: parsedRtpCaps })) {
                return callback({ code: 5, message: 'Cannot consume' });
            }

            const consumer = await transport.consume({
                producerId: producer.id,
                rtpCapabilities: parsedRtpCaps,
                paused: true,
            });

            consumer.on('producerpause', () => {
                logger.info(`Producer paused, pausing consumer ${consumer.id}`);
            });

            consumer.on('producerresume', () => {
                logger.info(`Producer resumed, resuming consumer ${consumer.id}`);
            });

            consumers.set(consumer.id, consumer);

            callback(null, {
                params: JSON.stringify({
                    id: consumer.id,
                    producerId: producer.id,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                    type: consumer.type,
                    appData: consumer.appData,
                })
            });
        } catch (error: any) {
            logger.error(`Consume error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    },

    ResumeConsumer: async (call: any, callback: any) => {
        const { consumerId } = call.request;
        try {
            const consumer = consumers.get(consumerId);
            if (!consumer) {
                logger.warn(`ResumeConsumer: Consumer ${consumerId} not found`);
                return callback({ code: 5, message: 'Consumer not found' });
            }
            await consumer.resume();
            logger.info(`Consumer resumed: ${consumerId} (kind: ${consumer.kind})`);
            callback(null, {});
        } catch (error: any) {
            logger.error(`ResumeConsumer error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    },

    CloseProducer: async (call: any, callback: any) => {
        const { producerId } = call.request;
        try {
            const producer = producers.get(producerId);
            if (producer) {
                producer.close();
                producers.delete(producerId);
                for (const [, room] of rooms.entries()) {
                    if (room.producers.has(producerId)) {
                        room.producers.delete(producerId);
                        break;
                    }
                }
            }
            callback(null, {});
        } catch (error: any) {
            logger.error(`CloseProducer error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    },

    PauseProducer: async (call: any, callback: any) => {
        const { producerId } = call.request;
        try {
            const producer = producers.get(producerId);
            if (!producer) return callback({ code: 5, message: 'Producer not found' });
            await producer.pause();
            callback(null, {});
        } catch (error: any) {
            logger.error(`PauseProducer error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    },

    ResumeProducer: async (call: any, callback: any) => {
        const { producerId } = call.request;
        try {
            const producer = producers.get(producerId);
            if (!producer) return callback({ code: 5, message: 'Producer not found' });
            await producer.resume();
            callback(null, {});
        } catch (error: any) {
            logger.error(`ResumeProducer error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    },

    GetProducers: async (call: any, callback: any) => {
        const { roomId } = call.request;
        try {
            const room = rooms.get(roomId);
            if (!room) return callback(null, { producers: JSON.stringify([]) });

            const producerList: any[] = [];
            for (const [producerId, data] of room.producers.entries()) {
                if (!data.producer.closed) {
                    producerList.push({
                        producerId,
                        userId: data.userId,
                        appData: data.appData
                    });
                }
            }
            callback(null, { producers: JSON.stringify(producerList) });
        } catch (error: any) {
            logger.error(`GetProducers error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    },

    CleanupUser: async (call: any, callback: any) => {
        const { roomId, userId } = call.request;
        try {
            const room = rooms.get(roomId);
            if (room) {
                const toDelete: string[] = [];
                for (const [id, data] of room.producers.entries()) {
                    if (data.userId === userId) {
                        data.producer.close();
                        toDelete.push(id);
                        producers.delete(id);
                    }
                }
                toDelete.forEach(id => room.producers.delete(id));
            }
            callback(null, {});
        } catch (error: any) {
            logger.error(`CleanupUser error: ${error.message}`);
            callback({ code: 5, message: error.message });
        }
    }
};

const start = async () => {
    try {
        logger.info('Initializing Media Service...');
        await createWorkers();
        logger.info('Mediasoup workers created');

        app.listen(PORT, async () => {
            logger.info(`Media Service REST API running on port ${PORT}`);
            await registerService('media-service', Number(PORT));
        });

        startGrpcServer(grpcHandlers);
    } catch (err: any) {
        logger.error(`Failed to start Media Service: ${err.message}`);
        process.exit(1);
    }
};

start();
