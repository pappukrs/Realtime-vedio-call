import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

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

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
