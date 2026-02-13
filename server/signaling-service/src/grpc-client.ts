import { getMediaDefinition, logger, grpcLib as grpc } from 'common';
import util from 'util';

// @ts-ignore
const mediaProto = (getMediaDefinition() as any).media;
const MEDIA_SERVICE_GRPC_URL = process.env.MEDIA_SERVICE_GRPC_URL || 'media-service:50051';

logger.info(`Initializing gRPC client for MediaService at ${MEDIA_SERVICE_GRPC_URL}`);

const client = new mediaProto.MediaService(
    MEDIA_SERVICE_GRPC_URL,
    grpc.credentials.createInsecure()
);

// Promisify client methods and export with PascalCase to match Proto definitions
export const mediaGrpcClient = {
    GetRouterRtpCapabilities: util.promisify(client.GetRouterRtpCapabilities).bind(client),
    CreateWebRtcTransport: util.promisify(client.CreateWebRtcTransport).bind(client),
    ConnectWebRtcTransport: util.promisify(client.ConnectWebRtcTransport).bind(client),
    Produce: util.promisify(client.Produce).bind(client),
    Consume: util.promisify(client.Consume).bind(client),
    ResumeConsumer: util.promisify(client.ResumeConsumer).bind(client),
    CloseProducer: util.promisify(client.CloseProducer).bind(client),
    PauseProducer: util.promisify(client.PauseProducer).bind(client),
    ResumeProducer: util.promisify(client.ResumeProducer).bind(client),
    GetProducers: util.promisify(client.GetProducers).bind(client),
    CleanupUser: util.promisify(client.CleanupUser).bind(client),
};
