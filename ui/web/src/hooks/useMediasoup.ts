import { Device } from 'mediasoup-client';
import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useRoomStore } from '@/store/useRoomStore';

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
        if (!socket || !roomId) return;

        const sessionKey = roomId + socket.id;
        if (initializedRef.current === sessionKey) return;
        initializedRef.current = sessionKey;

        const initMediasoup = async () => {
            console.log('--- Mediasoup Initialization Started ---', { socketId: socket.id, roomId });

            // 0. Get Local Media
            let localStream: MediaStream | null = null;
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const videoTrack = localStream.getVideoTracks()[0];
                const audioTrack = localStream.getAudioTracks()[0];

                console.log('Local media acquired', { videoTrack, audioTrack });
                upsertParticipant('local', { userId: 'local', isLocal: true, videoTrack, audioTrack });
                console.log('Local participant added to store');
            } catch (err) {
                console.error('getUserMedia error:', err);
            }

            // 1. Get Router RTP Capabilities
            socket.emit('getRouterRtpCapabilities', { roomId }, async (data: any) => {
                if (data.error) {
                    console.error('getRouterRtpCapabilities error:', data.error);
                    return;
                }

                try {
                    const device = new Device();
                    await device.load({ routerRtpCapabilities: data.rtpCapabilities });
                    deviceRef.current = device;

                    // 2. Create Transports
                    const createTransport = (direction: 'send' | 'recv') => {
                        return new Promise<any>((resolve, reject) => {
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
                        socket.emit('connectWebRtcTransport', { transportId: sendTransport.id, dtlsParameters }, (err: any) => {
                            if (err) return errback(err);
                            callback();
                        });
                    });

                    sendTransport.on('produce', ({ kind, rtpParameters, appData }: any, callback: any, errback: any) => {
                        socket.emit('produce', {
                            transportId: sendTransport.id,
                            kind,
                            rtpParameters,
                            appData: { ...appData, roomId, userId: socket.id }
                        }, (produceData: any) => {
                            if (produceData.error) return errback(new Error(produceData.error));
                            callback({ id: produceData.id });
                        });
                    });

                    if (localStream) {
                        const videoTrack = localStream.getVideoTracks()[0];
                        const audioTrack = localStream.getAudioTracks()[0];

                        if (videoTrack) {
                            const videoProducer = await sendTransport.produce({ track: videoTrack, appData: { type: 'video' } });
                            videoProducerRef.current = videoProducer;
                        }
                        if (audioTrack) {
                            const audioProducer = await sendTransport.produce({ track: audioTrack, appData: { type: 'audio' } });
                            audioProducerRef.current = audioProducer;
                        }
                    }

                    // 4. Setup Receive Transport
                    const recvTransport = device.createRecvTransport(recvParams);
                    recvTransport.on('connect', ({ dtlsParameters }: any, callback: any, errback: any) => {
                        socket.emit('connectWebRtcTransport', { transportId: recvTransport.id, dtlsParameters }, (err: any) => {
                            if (err) return errback(err);
                            callback();
                        });
                    });

                    const consumeProducer = async (producerId: string, userId: string, appData: any = {}) => {
                        if (userId === socket.id) return;
                        if (consumersRef.current.has(producerId)) return;
                        consumersRef.current.add(producerId);

                        socket.emit('consume', {
                            roomId,
                            transportId: recvTransport.id,
                            producerId,
                            rtpCapabilities: device.rtpCapabilities
                        }, async (consumeData: any) => {
                            if (consumeData.error) {
                                consumersRef.current.delete(producerId);
                                return;
                            }

                            try {
                                const consumer = await recvTransport.consume(consumeData.params);
                                socket.emit('resumeConsumer', { consumerId: consumer.id });

                                upsertParticipant(userId, { userId, isLocal: false });

                                const trackType = appData?.type === 'screen' ? 'screen' : consumer.kind as any;
                                updateParticipantTracks(userId, trackType, consumer.track);

                                // Handle validation for already paused producers
                                // FIX: Check producerPaused, not local consumer.paused (which starts true)
                                if ((consumer as any).producerPaused) {
                                    updateParticipantPausedState(userId, consumer.kind as 'video' | 'audio', true);
                                }

                                consumer.on('transportclose', () => {
                                    updateParticipantTracks(userId, trackType, undefined);
                                    consumersRef.current.delete(producerId);
                                });

                                // Cast consumer to any to avoid TS errors with specific mediasoup-client versions
                                (consumer as any).on('producerpause', () => {
                                    console.log('Consumer paused:', consumer.id, consumer.kind);
                                    updateParticipantPausedState(userId, consumer.kind as 'video' | 'audio', true);
                                });

                                (consumer as any).on('producerresume', () => {
                                    console.log('Consumer resumed:', consumer.id, consumer.kind);
                                    updateParticipantPausedState(userId, consumer.kind as 'video' | 'audio', false);
                                });

                            } catch (err) {
                                console.error('Consume failed:', err);
                                consumersRef.current.delete(producerId);
                            }
                        });
                    };

                    socket.on('newProducer', ({ producerId, userId, appData }: any) => {
                        console.log('🎥 New producer detected:', { producerId, userId, appData });
                        consumeProducer(producerId, userId, appData);
                    });

                    socket.on('userJoined', ({ userId, userName }: { userId: string, userName?: string }) => {
                        console.log('🟢 User joined:', userId, userName);
                        upsertParticipant(userId, { userId, userName, isLocal: false });
                    });

                    socket.on('userLeft', ({ userId }: { userId: string }) => {
                        removeParticipant(userId);
                    });

                    // Listen for producer closed events from other peers (e.g. screen share stopped)
                    socket.on('producerClosed', ({ producerId, userId }: { producerId: string; userId: string }) => {
                        console.log('🔴 Producer closed:', { producerId, userId });
                        consumersRef.current.delete(producerId);

                        // FIX: Only clear screen track if it was actually a screen producer
                        // Since we don't map producerId -> type, we re-evaluate logic.
                        // Ideally we'd remove the track from the consumer list.
                        // But we don't have the consumer object easily accessible by producerId here without a map.
                        // However, 'producerClosed' is also triggered by manual close.
                        // Given we can't easily know if it was screen or video, and video now pauses...
                        // We will try to rely on track updates from 'transportclose' on consumer if possible.
                        // BUT 'transportclose' is only if transport closes.

                        // Let's assume producerClosed means "Stop everything from this producer".
                        // We really should clear the screen track if it exists.
                        // To allow video to re-connect if needed, we just clear screen for now as fail-safe.
                        updateParticipantTracks(userId, 'screen', undefined);
                    });

                    // Fetch existing producers for late joiners
                    socket.emit('getProducers', { roomId }, (data: any) => {
                        console.log('📋 Existing producers:', data);
                        if (data && data.producers) {
                            data.producers.forEach((p: any) => consumeProducer(p.producerId, p.userId, p.appData));
                        }
                    });

                } catch (err) {
                    console.error('Mediasoup initialization error:', err);
                }
            });
        };

        const timeoutId = setTimeout(initMediasoup, 1000);

        return () => {
            console.log('Cleaning up useMediasoup');
            clearTimeout(timeoutId);
            socket.off('newProducer');
            socket.off('userJoined');
            socket.off('userLeft');
            socket.off('producerClosed');
            initializedRef.current = null;
            consumersRef.current.clear();
        };
    }, [socket, roomId, upsertParticipant, removeParticipant, updateParticipantTracks, updateParticipantPausedState]);

    const startScreenShare = async () => {
        if (!sendTransportRef.current) return;
        try {
            // Simple constraints for maximum compatibility
            const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
            const track = stream.getVideoTracks()[0];

            const producer = await sendTransportRef.current.produce({
                track,
                appData: { type: 'screen' }
            });

            screenProducerRef.current = producer;
            setIsScreenSharing(true);
            upsertParticipant('local', { screenTrack: track } as any);

            track.onended = () => stopScreenShare();

            producer.on('transportclose', () => {
                setIsScreenSharing(false);
                upsertParticipant('local', { screenTrack: undefined } as any);
            });

        } catch (err) {
            console.error('startScreenShare error:', err);
        }
    };

    const stopScreenShare = () => {
        if (screenProducerRef.current) {
            screenProducerRef.current.close();
            socket?.emit('producerClosed', {
                producerId: screenProducerRef.current.id,
                roomId
            });
            screenProducerRef.current = null;
        }
        setIsScreenSharing(false);
        upsertParticipant('local', { screenTrack: undefined } as any);
    };

    const toggleMic = () => {
        if (audioProducerRef.current) {
            const track = audioProducerRef.current.track;
            if (track) {
                // track.enabled = !track.enabled; // OLD WAY

                if (isMicOn) {
                    // Mute: Pause producer
                    audioProducerRef.current.pause();
                    socket?.emit('pauseProducer', { producerId: audioProducerRef.current.id, roomId });
                    updateParticipantPausedState('local', 'audio', true);
                } else {
                    // Unmute: Resume producer
                    audioProducerRef.current.resume();
                    socket?.emit('resumeProducer', { producerId: audioProducerRef.current.id, roomId });
                    updateParticipantPausedState('local', 'audio', false);
                }

                setIsMicOn(!isMicOn);
            }
        }
    };

    const toggleVideo = () => {
        if (videoProducerRef.current) {
            const track = videoProducerRef.current.track;
            if (track) {
                // track.enabled = !track.enabled; // OLD WAY

                if (isVideoOn) {
                    // Disable video: Pause producer
                    videoProducerRef.current.pause();
                    socket?.emit('pauseProducer', { producerId: videoProducerRef.current.id, roomId });
                    updateParticipantPausedState('local', 'video', true);
                } else {
                    // Enable video: Resume producer
                    videoProducerRef.current.resume();
                    socket?.emit('resumeProducer', { producerId: videoProducerRef.current.id, roomId });
                    updateParticipantPausedState('local', 'video', false);
                }

                setIsVideoOn(!isVideoOn);
            }
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
