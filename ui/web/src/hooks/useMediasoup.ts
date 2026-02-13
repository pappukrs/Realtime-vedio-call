"use client";

import { Device } from 'mediasoup-client';
import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useRoomStore } from '@/store/useRoomStore';
import { logger } from '@/lib/logger';

// Use any for complex mediasoup types to avoid version-specific import issues
type Transport = any;
type Producer = any;

export const useMediasoup = (socket: Socket | null, roomId: string | null) => {
    const deviceRef = useRef<Device | null>(null);
    const sendTransportRef = useRef<Transport | null>(null);
    const audioProducerRef = useRef<Producer | null>(null);
    const videoProducerRef = useRef<Producer | null>(null);
    const screenProducerRef = useRef<Producer | null>(null);
    const initializedRef = useRef<string | null>(null);
    const consumersRef = useRef<Set<string>>(new Set());

    const upsertParticipant = useRoomStore((state) => state.upsertParticipant);
    const removeParticipant = useRoomStore((state) => state.removeParticipant);
    const updateParticipantTracks = useRoomStore((state) => state.updateParticipantTracks);
    const updateParticipantPausedState = useRoomStore((state) => state.updateParticipantPausedState);

    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    useEffect(() => {
        if (!socket || !roomId || !socket.id) {
            if (socket && !socket.id) {
                logger.info('Waiting for socket ID before initializing Mediasoup...');
            }
            return;
        }

        const sessionKey = roomId + socket.id;
        if (initializedRef.current === sessionKey) return;
        initializedRef.current = sessionKey;

        const initMediasoup = async () => {
            logger.info('--- Mediasoup Initialization Started ---', { socketId: socket.id, roomId });

            // 0. Get Local Media
            let localStream: MediaStream | null = null;
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const videoTrack = localStream.getVideoTracks()[0];
                const audioTrack = localStream.getAudioTracks()[0];

                logger.info('Local media acquired', { videoTrackId: videoTrack?.id, audioTrackId: audioTrack?.id });
                upsertParticipant('local', { userId: 'local', isLocal: true, videoTrack, audioTrack });
            } catch (err) {
                logger.error('getUserMedia error:', err);
            }

            // 1. Get Router RTP Capabilities
            socket.emit('getRouterRtpCapabilities', { roomId }, async (data: any) => {
                if (data.error) {
                    logger.error('getRouterRtpCapabilities error:', data.error);
                    return;
                }

                try {
                    const device = new Device();
                    await device.load({ routerRtpCapabilities: data.rtpCapabilities });
                    deviceRef.current = device;
                    logger.info('Mediasoup device loaded');

                    // 2. Create Transports
                    const createTransport = (direction: 'send' | 'recv') => {
                        return new Promise<any>((resolve, reject) => {
                            logger.info(`Creating ${direction} transport...`);
                            socket.emit('createWebRtcTransport', { roomId, direction }, (transportData: any) => {
                                if (transportData.error) reject(new Error(transportData.error));
                                else resolve(transportData.params);
                            });
                        });
                    };

                    const [sendParams, recvParams] = await Promise.all([
                        createTransport('send'),
                        createTransport('recv')
                    ]);

                    // 3. Setup Send Transport
                    const sendTransport = device.createSendTransport(sendParams);
                    sendTransportRef.current = sendTransport;

                    sendTransport.on('connect', ({ dtlsParameters }: any, callback: any, errback: any) => {
                        logger.info('sendTransport connect event fired');
                        socket.emit('connectWebRtcTransport', { transportId: sendTransport.id, dtlsParameters }, (err: any) => {
                            if (err) {
                                logger.error('connectWebRtcTransport error (send):', err);
                                return errback(err);
                            }
                            callback();
                        });
                    });

                    sendTransport.on('produce', ({ kind, rtpParameters, appData }: any, callback: any, errback: any) => {
                        logger.info(`sendTransport produce event fired (${kind})`);
                        socket.emit('produce', {
                            transportId: sendTransport.id,
                            kind,
                            rtpParameters,
                            appData: { ...appData, roomId, userId: socket.id }
                        }, (produceData: any) => {
                            if (produceData.error) {
                                logger.error(`Produce error (${kind}):`, produceData.error);
                                return errback(new Error(produceData.error));
                            }
                            logger.info(`${kind} producer created: ${produceData.id}`);
                            callback({ id: produceData.id });
                        });
                    });

                    // Function to produce local tracks
                    const createProducers = async (stream: MediaStream) => {
                        const videoTrack = stream.getVideoTracks()[0];
                        const audioTrack = stream.getAudioTracks()[0];

                        try {
                            if (videoTrack) {
                                logger.info('Attempting to produce video track...');
                                const videoProducer = await sendTransport.produce({
                                    track: videoTrack,
                                    appData: { type: 'video', roomId }
                                });
                                videoProducerRef.current = videoProducer;
                                logger.info('Video producer assigned to ref');
                            }
                            if (audioTrack) {
                                logger.info('Attempting to produce audio track...');
                                const audioProducer = await sendTransport.produce({
                                    track: audioTrack,
                                    appData: { type: 'audio', roomId }
                                });
                                audioProducerRef.current = audioProducer;
                                logger.info('Audio producer assigned to ref');
                            }
                        } catch (err) {
                            logger.error('Error during initial production:', err);
                        }
                    };

                    if (localStream) {
                        await createProducers(localStream);
                    }

                    // 4. Setup Receive Transport
                    const recvTransport = device.createRecvTransport(recvParams);
                    recvTransport.on('connect', ({ dtlsParameters }: any, callback: any, errback: any) => {
                        logger.info('recvTransport connect event fired');
                        socket.emit('connectWebRtcTransport', { transportId: recvTransport.id, dtlsParameters }, (err: any) => {
                            if (err) {
                                logger.error('connectWebRtcTransport error (recv):', err);
                                return errback(err);
                            }
                            callback();
                        });
                    });

                    const consumeProducer = async (producerId: string, userId: string, appData: any = {}) => {
                        if (userId === socket.id) return;
                        if (consumersRef.current.has(producerId)) return;
                        consumersRef.current.add(producerId);

                        logger.info(`Attempting to consume producer ${producerId} from user ${userId}`);
                        socket.emit('consume', {
                            roomId,
                            transportId: recvTransport.id,
                            producerId,
                            rtpCapabilities: device.rtpCapabilities
                        }, async (consumeData: any) => {
                            if (consumeData.error) {
                                logger.error(`Consume error for producer ${producerId}:`, consumeData.error);
                                consumersRef.current.delete(producerId);
                                return;
                            }

                            try {
                                const consumer = await recvTransport.consume(consumeData.params);
                                logger.info(`Consumer created: ${consumer.id} (${consumer.kind})`);
                                socket.emit('resumeConsumer', { consumerId: consumer.id });

                                upsertParticipant(userId, { userId, isLocal: false });

                                const trackType = appData?.type === 'screen' ? 'screen' : consumer.kind as any;
                                updateParticipantTracks(userId, trackType, consumer.track);

                                if ((consumer as any).producerPaused) {
                                    updateParticipantPausedState(userId, consumer.kind as 'video' | 'audio', true);
                                }

                                consumer.on('transportclose', () => {
                                    logger.warn(`Consumer transport closed: ${consumer.id}`);
                                    updateParticipantTracks(userId, trackType, undefined);
                                    consumersRef.current.delete(producerId);
                                });

                                (consumer as any).on('producerpause', () => {
                                    logger.info(`Producer paused by peer (${consumer.kind}): ${userId}`);
                                    updateParticipantPausedState(userId, consumer.kind as 'video' | 'audio', true);
                                });

                                (consumer as any).on('producerresume', () => {
                                    logger.info(`Producer resumed by peer (${consumer.kind}): ${userId}`);
                                    updateParticipantPausedState(userId, consumer.kind as 'video' | 'audio', false);
                                });

                            } catch (err) {
                                logger.error(`Consume failed for producer ${producerId}:`, err);
                                consumersRef.current.delete(producerId);
                            }
                        });
                    };

                    socket.on('newProducer', ({ producerId, userId, appData }: any) => {
                        logger.info('New producer event from signaling:', { producerId, userId, appData });
                        consumeProducer(producerId, userId, appData);
                    });

                    socket.on('userJoined', ({ userId, userName }: { userId: string, userName?: string }) => {
                        logger.info(`User joined room: ${userId} (${userName || 'Unknown'})`);
                        upsertParticipant(userId, { userId, userName, isLocal: false });
                    });

                    socket.on('userLeft', ({ userId }: { userId: string }) => {
                        logger.info(`User left room: ${userId}`);
                        removeParticipant(userId);
                    });

                    socket.on('producerPaused', ({ producerId, userId, kind }: any) => {
                        logger.info(`Peer paused ${kind}: ${userId}`);
                        updateParticipantPausedState(userId, kind, true);
                    });

                    socket.on('producerResumed', ({ producerId, userId, kind }: any) => {
                        logger.info(`Peer resumed ${kind}: ${userId}`);
                        updateParticipantPausedState(userId, kind, false);
                    });

                    socket.on('producerClosed', ({ producerId, userId }: { producerId: string; userId: string }) => {
                        logger.info(`Producer closed by peer: ${producerId}`);
                        consumersRef.current.delete(producerId);
                        updateParticipantTracks(userId, 'screen', undefined);
                    });

                    socket.emit('getProducers', { roomId }, (data: any) => {
                        if (data && data.producers) {
                            logger.info(`Found ${data.producers.length} existing producers in room`);
                            data.producers.forEach((p: any) => consumeProducer(p.producerId, p.userId, p.appData));
                        }
                    });

                } catch (err) {
                    logger.error('Mediasoup initialization step error:', err);
                }
            });
        };

        const timeoutId = setTimeout(initMediasoup, 500);

        return () => {
            logger.info('Cleaning up useMediasoup hook');
            clearTimeout(timeoutId);
            socket.off('newProducer');
            socket.off('userJoined');
            socket.off('userLeft');
            socket.off('producerClosed');
            socket.off('producerPaused');
            socket.off('producerResumed');
            initializedRef.current = null;
            consumersRef.current.clear();
        };
    }, [socket, socket?.id, roomId, upsertParticipant, removeParticipant, updateParticipantTracks, updateParticipantPausedState]);

    const startScreenShare = async () => {
        if (!sendTransportRef.current) {
            logger.error('Cannot start screen share: sendTransport not ready');
            return;
        }
        try {
            logger.info('Starting screen share request...');
            const stream = await (navigator.mediaDevices as any).getDisplayMedia({
                video: { cursor: 'always' },
                audio: false
            });
            const track = stream.getVideoTracks()[0];
            logger.info('Screen track acquired:', track.label);

            const producer = await sendTransportRef.current.produce({
                track,
                appData: { type: 'screen', roomId }
            });

            logger.info(`Screen share producer created: ${producer.id}`);

            screenProducerRef.current = producer;
            updateParticipantTracks('local', 'screen', track);
            setIsScreenSharing(true);

            track.onended = () => {
                logger.info('Screen share track ended manually');
                stopScreenShare();
            };

            producer.on('transportclose', () => {
                logger.warn('Screen share producer transport closed');
                stopScreenShare();
            });

        } catch (err) {
            logger.error('startScreenShare error:', err);
        }
    };

    const stopScreenShare = () => {
        if (screenProducerRef.current) {
            logger.info(`Stopping screen share producer: ${screenProducerRef.current.id}`);
            screenProducerRef.current.close();
            socket?.emit('producerClosed', {
                producerId: screenProducerRef.current.id,
                roomId
            });
            screenProducerRef.current = null;
        }
        updateParticipantTracks('local', 'screen', undefined);
        setIsScreenSharing(false);
    };

    const toggleMic = async () => {
        if (!audioProducerRef.current) {
            logger.warn('No audio producer available for toggle');
            setIsMicOn(!isMicOn);
            return;
        }

        try {
            if (isMicOn) {
                logger.info('Pausing audio producer...');
                await audioProducerRef.current.pause();
                socket?.emit('pauseProducer', { producerId: audioProducerRef.current.id, roomId, kind: 'audio' });
                updateParticipantPausedState('local', 'audio', true);
            } else {
                logger.info('Resuming audio producer...');
                await audioProducerRef.current.resume();
                socket?.emit('resumeProducer', { producerId: audioProducerRef.current.id, roomId, kind: 'audio' });
                updateParticipantPausedState('local', 'audio', false);
            }
            setIsMicOn(!isMicOn);
        } catch (err) {
            logger.error('Error toggling mic:', err);
        }
    };

    const toggleVideo = async () => {
        if (!videoProducerRef.current) {
            logger.warn('No video producer available for toggle');
            setIsVideoOn(!isVideoOn);
            return;
        }

        try {
            if (isVideoOn) {
                logger.info('Pausing video producer...');
                await videoProducerRef.current.pause();
                socket?.emit('pauseProducer', { producerId: videoProducerRef.current.id, roomId, kind: 'video' });
                updateParticipantPausedState('local', 'video', true);
            } else {
                logger.info('Resuming video producer...');
                await videoProducerRef.current.resume();
                socket?.emit('resumeProducer', { producerId: videoProducerRef.current.id, roomId, kind: 'video' });
                updateParticipantPausedState('local', 'video', false);
            }
            setIsVideoOn(!isVideoOn);
        } catch (err) {
            logger.error('Error toggling video:', err);
        }
    };

    return {
        startScreenShare,
        stopScreenShare,
        isScreenSharing,
        toggleMic,
        toggleVideo,
        isMicOn,
        isVideoOn
    };
};
