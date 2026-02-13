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
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/videocall',
});

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

class BackendLogger {
    private logDir = '/app/logs';
    private logFile: string | null = null;

    constructor() {
        const serviceName = process.env.SERVICE_NAME;
        if (serviceName) {
            this.logFile = path.join(this.logDir, `${serviceName}.log`);
            try {
                if (!fs.existsSync(this.logDir)) {
                    fs.mkdirSync(this.logDir, { recursive: true });
                }
                // Write session separator
                fs.appendFileSync(this.logFile, `\n\n--- NEW SESSION: ${new Date().toISOString()} ---\n`);
            } catch (err) {
                console.error(`Failed to initialize file logging: ${err}`);
            }
        }
    }

    private format(level: string, msg: string, data?: any) {
        const timestamp = new Date().toISOString();
        const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
        return `[${timestamp}] [${level}] ${msg}${dataStr}`;
    }

    private writeToFile(formattedMsg: string) {
        if (this.logFile) {
            try {
                fs.appendFileSync(this.logFile, formattedMsg + '\n');
            } catch (err) {
                // Ignore file write errors after initial failure to prevent loop
            }
        }
    }

    info(msg: string, data?: any) {
        const formatted = this.format('INFO', msg, data);
        console.log(formatted);
        this.writeToFile(formatted);
    }

    warn(msg: string, data?: any) {
        const formatted = this.format('WARN', msg, data);
        console.warn(formatted);
        this.writeToFile(formatted);
    }

    error(msg: string, data?: any) {
        const formatted = this.format('ERROR', msg, data);
        console.error(formatted);
        this.writeToFile(formatted);
    }
}

export const logger = new BackendLogger();

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
