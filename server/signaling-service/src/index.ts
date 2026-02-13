import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { logger, pool } from 'common';
import { handleWebRTC } from './handlers/webrtc.handler.js';
import { handleRoom } from './handlers/room.handler.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Initialize Database
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id UUID PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT TRUE
            );
        `);
        logger.info('Database initialized: rooms table checked/created');
    } catch (err) {
        logger.error('Failed to initialize database:', err);
    }
};

initDB();

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/rooms', async (req, res) => {
    try {
        const roomId = randomUUID();
        await pool.query('INSERT INTO rooms (id) VALUES ($1)', [roomId]);
        logger.info(`Created new room: ${roomId}`);
        res.json({ roomId });
    } catch (error) {
        logger.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

app.get('/rooms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Room not found' });
        }
    } catch (error) {
        logger.error('Error fetching room:', error);
        res.status(500).json({ error: 'Failed to fetch room' });
    }
});

io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    handleWebRTC(socket, io);
    handleRoom(socket, io);

    socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    logger.info(`Signaling Service running on port ${PORT}`);
});
