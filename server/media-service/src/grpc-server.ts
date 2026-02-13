import * as grpc from '@grpc/grpc-js';
import { getMediaDefinition, logger } from 'common';

// @ts-ignore
const mediaProto = getMediaDefinition().media;

export const startGrpcServer = (implementations: any) => {
    const server = new grpc.Server();

    server.addService(mediaProto.MediaService.service, implementations);

    const PORT = process.env.GRPC_PORT || 50051;
    server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            logger.error(`Failed to bind gRPC server: ${err.message}`);
            return;
        }
        logger.info(`gRPC Media Server running on port ${port}`);
        server.start();
    });
};
