import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { createWorkers } from './mediasoup/worker.js';
import { handleWebRTC } from './socket/handlers/webrtc.handler.js';
import { handleRoom } from './socket/handlers/room.handler.js';

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    handleWebRTC(socket);
    handleRoom(socket);

    socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
    });
});

const startServer = async () => {
    try {
        await createWorkers();
        server.listen(config.port, () => {
            logger.info(`Server running on port ${config.port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
