import RedisPkg from 'ioredis';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const Redis = (RedisPkg as any).default || RedisPkg;
const redis = new Redis(config.redis.url);

redis.on('connect', () => {
    logger.info('Connected to Redis');
});

redis.on('error', (err: any) => {
    logger.error('Redis connection error:', err);
});

export default redis;
