import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { register, registerService, httpRequestsTotal, httpRequestDuration, logger } from 'common';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is healthy' });
});

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Middleware to track HTTP requests
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

// Proxy routes to internal services
// Note: In a real scenario, these URLs would be environment variables
const services = {
    media: 'http://media-service:6000',
    signaling: 'http://signaling-service:5000',
};

app.use('/api/media', createProxyMiddleware({
    target: services.media,
    changeOrigin: true,
    pathRewrite: {
        '^/api/media': '',
    },
}));

app.use('/api/rooms', createProxyMiddleware({
    target: services.signaling,
    changeOrigin: true,
    pathRewrite: {
        '^/api/rooms': '/rooms',
    },
}));

app.listen(PORT, async () => {
    logger.info(`API Gateway running on port ${PORT}`);
    await registerService('api-gateway', Number(PORT));
});
