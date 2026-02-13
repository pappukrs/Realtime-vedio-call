// Use any for types to unblock ESM/TS issues
type Router = any;
type WebRtcTransport = any;

import { config } from './config.js';
import { logger } from 'common';

export const createWebRtcTransport = async (router: Router): Promise<WebRtcTransport> => {
    const {
        listenIps,
        initialAvailableOutgoingBitrate,
        minimumAvailableOutgoingBitrate,
        maxSctpMessageSize,
    } = config.mediasoup.webRtcTransport;

    const transport = await router.createWebRtcTransport({
        listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate,
    });


    transport.on('dtlsstatechange', (dtlsState: any) => {
        if (dtlsState === 'closed') {
            transport.close();
        }
    });

    transport.on('routerclose', () => {
        transport.close();
    });

    return transport;
};
