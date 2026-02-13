import express from 'express';
import cors from 'cors';
import { createWorkers, createRouter } from './worker.js';
import { createWebRtcTransport } from './transport.js';
import { logger } from 'common';

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json());

// In-memory storage for Mediasoup objects (instance specific)
const rooms = new Map<string, any>();
const transports = new Map<string, any>();
const producers = new Map<string, any>();
const consumers = new Map<string, any>();

// Initialize Mediasoup workers
createWorkers().then(() => {
    logger.info('Mediasoup workers created');
}).catch(err => {
    logger.error('Failed to create mediasoup workers:', err);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

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

        // Store producer in the room's producer map with userId from appData
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

// GET all producers for a room (used by late joiners via getProducers)
app.get('/rooms/:roomId/producers', (req, res) => {
    const { roomId } = req.params;
    try {
        const room = rooms.get(roomId);
        if (!room) {
            return res.json({ producers: [] });
        }

        const producerList: { producerId: string; userId: string; appData: any }[] = [];
        for (const [producerId, data] of room.producers.entries()) {
            // Only include active (non-closed) producers
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

        if (!room || !transport || !producer) {
            return res.status(404).json({ error: 'Resource not found' });
        }

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

            // Also remove from room's producer map
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
            // Find and close producers for this user
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

app.listen(PORT, () => {
    logger.info(`Media Service running on port ${PORT}`);
});
