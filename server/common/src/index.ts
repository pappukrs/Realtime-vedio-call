import pg from 'pg';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import * as grpc from '@grpc/grpc-js';
import client from 'prom-client';
import Consul from 'consul';
export { grpc as grpcLib };
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/videocall',
});

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const logger = {
    info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
    warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
};

// gRPC helpers
export const PROTO_PATH = path.join(__dirname, 'proto/media.proto');

export const getMediaDefinition = () => {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    });
    return (grpc.loadPackageDefinition(packageDefinition) as any);
};

// Prometheus Metrics
export const register = client.register;
client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
});

export const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status'],
});

// Consul Registration
export const consul = new (Consul as any)({
    host: process.env.CONSUL_HOST || 'consul',
    port: process.env.CONSUL_PORT || '8500',
});

export const registerService = async (name: string, port: number) => {
    const id = `${name}-${port}`;
    try {
        await consul.agent.service.register({
            id,
            name,
            address: process.env.SERVICE_HOST || name,
            port,
            check: {
                http: `http://${process.env.SERVICE_HOST || name}:${port}/health`,
                interval: '10s',
                timeout: '5s',
            },
        });
        logger.info(`Service ${name} registered with Consul at ${id}`);
    } catch (err) {
        logger.error(`Failed to register service ${name} with Consul:`, err);
    }
};
