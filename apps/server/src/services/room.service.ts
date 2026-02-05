import redis from '../redis/client.js';
import { createRouter } from '../mediasoup/worker.js';

// Use any for types to unblock ESM/TS issues
type Router = any;

interface ProducerInfo {
    producerId: string;
    userId: string;
}

interface Room {
    id: string;
    router: Router;
    producers: Map<string, ProducerInfo>; // producerId -> info
}

const rooms = new Map<string, Room>();

export const getOrCreateRoom = async (roomId: string): Promise<Room> => {
    let room = rooms.get(roomId);

    if (!room) {
        const router = await createRouter();
        room = { id: roomId, router, producers: new Map() };
        rooms.set(roomId, room);
    }

    return room;
};

export const addParticipantToRoom = async (roomId: string, userId: string, userName?: string) => {
    await redis.sadd(`room:${roomId}:participants`, userId);
    if (userName) {
        await redis.hset(`room:${roomId}:names`, userId, userName);
    }
};

export const removeParticipantFromRoom = async (roomId: string, userId: string) => {
    await redis.srem(`room:${roomId}:participants`, userId);
    await redis.hdel(`room:${roomId}:names`, userId);

    // Cleanup room producers for this user
    const room = rooms.get(roomId);
    if (room) {
        for (const [id, info] of room.producers.entries()) {
            if (info.userId === userId) {
                room.producers.delete(id);
            }
        }
    }

    const count = await redis.scard(`room:${roomId}:participants`);
    if (count === 0) {
        // rooms.delete(roomId);
    }
};

export const getParticipantName = async (roomId: string, userId: string): Promise<string | null> => {
    return await redis.hget(`room:${roomId}:names`, userId);
};

export const addProducerToRoom = (roomId: string, producerId: string, userId: string) => {
    const room = rooms.get(roomId);
    if (room) {
        room.producers.set(producerId, { producerId, userId });
    }
};

export const removeProducerFromRoom = (roomId: string, producerId: string) => {
    const room = rooms.get(roomId);
    if (room) {
        room.producers.delete(producerId);
    }
};

export const getRoomProducers = (roomId: string) => {
    const room = rooms.get(roomId);
    return room ? Array.from(room.producers.values()) : [];
};
