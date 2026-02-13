import * as grpc from '@grpc/grpc-js';
import { getMediaDefinition, logger } from 'common';
import util from 'util';

// @ts-ignore
const mediaProto = getMediaDefinition().media;
const MEDIA_SERVICE_GRPC_URL = process.env.MEDIA_SERVICE_GRPC_URL || 'media-service:50051';

const client = new mediaProto.MediaService(
    MEDIA_SERVICE_GRPC_URL,
    grpc.credentials.createInsecure()
);

// Promisify client methods
export const mediaGrpcClient = {
    getRouterRtpCapabilities: util.promisify(client.GetRouterRtpCapabilities).bind(client),
    createWebRtcTransport: util.promisify(client.CreateWebRtcTransport).bind(client),
    connectWebRtcTransport: util.promisify(client.ConnectWebRtcTransport).bind(client),
    produce: util.promisify(client.Produce).bind(client),
    consume: util.promisify(client.Consume).bind(client),
    resumeConsumer: util.promisify(client.ResumeConsumer).bind(client),
    closeProducer: util.promisify(client.CloseProducer).bind(client),
    pauseProducer: util.promisify(client.PauseProducer).bind(client),
    resumeProducer: util.promisify(client.ResumeProducer).bind(client),
    getProducers: util.promisify(client.GetProducers).bind(client),
    cleanupUser: util.promisify(client.CleanupUser).bind(client),
};
