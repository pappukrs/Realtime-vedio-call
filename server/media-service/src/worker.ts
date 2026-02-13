import * as mediasoup from 'mediasoup';
import os from 'node:os';
// Use any for types to unblock ESM/TS issues
type Worker = any;
type Router = any;
import { config } from './config.js';
import { logger } from 'common';

const workers: Worker[] = [];
let nextWorkerIdx = 0;

export const createWorkers = async () => {
    const numWorkers = os.cpus().length;

    for (let i = 0; i < numWorkers; i++) {
        try {
            logger.info(`Creating mediasoup worker ${i + 1}/${numWorkers}...`);
            const worker = await mediasoup.createWorker({
                logLevel: config.mediasoup.worker.logLevel as any,
                logTags: config.mediasoup.worker.logTags as any,
                rtcMinPort: config.mediasoup.worker.rtcMinPort,
                rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
            });

            logger.info('Mediasoup Worker created', { pid: worker.pid });

            worker.on('died', () => {
                logger.error('mediasoup worker died, exiting in 2 seconds...', { pid: worker.pid });
                setTimeout(() => process.exit(1), 2000);
            });

            workers.push(worker);
        } catch (err: any) {
            logger.error(`Failed to create mediasoup worker ${i + 1}:`, {
                message: err.message,
                stack: err.stack,
                settings: {
                    logLevel: config.mediasoup.worker.logLevel,
                    logTags: config.mediasoup.worker.logTags,
                    rtcMinPort: config.mediasoup.worker.rtcMinPort,
                    rtcMaxPort: config.mediasoup.worker.rtcMaxPort
                }
            });
            throw err;
        }
    }
};

export const getMediasoupWorker = () => {
    const worker = workers[nextWorkerIdx];

    nextWorkerIdx++;
    if (nextWorkerIdx === workers.length) nextWorkerIdx = 0;

    return worker;
};

export const createRouter = async () => {
    const worker = getMediasoupWorker();
    return await worker.createRouter({
        mediaCodecs: config.mediasoup.router.mediaCodecs,
    });
};
