"use client";

import { useEffect, useRef } from 'react';
import { Pin, PinOff, User, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRoomStore } from '@/store/useRoomStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ParticipantTileProps {
    userId: string;
    userName?: string;
    videoTrack?: MediaStreamTrack;
    audioTrack?: MediaStreamTrack;
    screenTrack?: MediaStreamTrack;
    isLocal: boolean;
    isPinned: boolean;
    isVideoPaused?: boolean;
    isAudioPaused?: boolean;
}

export const ParticipantTile = ({ userId, userName, videoTrack, audioTrack, screenTrack, isLocal, isPinned, isVideoPaused, isAudioPaused }: ParticipantTileProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const setPinnedParticipant = useRoomStore((state) => state.setPinnedParticipant);

    // Video Handling
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let isPlaying = true;
        const updateVideo = async () => {
            // Priority: Screen Track > Video Track
            const track = screenTrack || (isVideoPaused ? undefined : videoTrack);

            if (track) {
                const stream = new MediaStream([track]);

                if (video.srcObject instanceof MediaStream) {
                    const currentTrack = video.srcObject.getVideoTracks()[0];
                    if (currentTrack?.id === track.id) return;
                }

                console.log(`[ParticipantTile ${userId}] Attaching VIDEO track: ${track.id}`);
                video.srcObject = stream;
                try {
                    await video.play();
                    console.log(`[ParticipantTile ${userId}] video.play() SUCCESS`);
                } catch (err: any) {
                    if (err.name !== 'AbortError' && isPlaying) {
                        console.error(`[ParticipantTile ${userId}] video.play() FAILED:`, err.message);
                    }
                }
            } else {
                video.srcObject = null;
            }
        };

        updateVideo();
        return () => { isPlaying = false; };
    }, [videoTrack, screenTrack, isVideoPaused, userId]);

    // Audio Handling
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || isLocal) return;

        let isPlaying = true;
        const updateAudio = async () => {
            const track = isAudioPaused ? undefined : audioTrack;

            if (track) {
                const stream = new MediaStream([track]);

                if (audio.srcObject instanceof MediaStream) {
                    const currentTrack = audio.srcObject.getAudioTracks()[0];
                    if (currentTrack?.id === track.id) return;
                }

                console.log(`[ParticipantTile ${userId}] Attaching AUDIO track: ${track.id}`);
                audio.srcObject = stream;
                try {
                    await audio.play();
                    console.log(`[ParticipantTile ${userId}] audio.play() SUCCESS`);
                } catch (err: any) {
                    if (err.name !== 'NotAllowedError' && isPlaying) {
                        console.error(`[ParticipantTile ${userId}] audio.play() FAILED:`, err.message);
                    }
                }
            } else {
                audio.srcObject = null;
            }
        };

        updateAudio();
        return () => { isPlaying = false; };
    }, [audioTrack, isAudioPaused, isLocal, userId]);

    const togglePin = () => {
        if (isPinned) {
            setPinnedParticipant(null);
        } else {
            setPinnedParticipant(userId);
        }
    };

    const showVideo = screenTrack || (videoTrack && !isVideoPaused);
    const showMicOff = (!audioTrack || isAudioPaused);

    return (
        <div className={cn(
            "group relative w-full h-full bg-[#0a0f1e]/40 rounded-[2.5rem] overflow-hidden flex items-center justify-center transition-all duration-700 border border-white/[0.03]",
            isPinned && "border-primary/40 shadow-[0_0_40px_rgba(59,130,246,0.1)]"
        )}>
            {/* Audio Element (Remote only) */}
            {!isLocal && <audio ref={audioRef} autoPlay playsInline className="hidden" />}

            {showVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted={true}
                    playsInline
                    className={cn(
                        "w-full h-full object-cover transition-transform duration-1000",
                        isPinned ? "scale-100" : "scale-[1.01] group-hover:scale-100",
                        screenTrack && "object-contain bg-[#050811]"
                    )}
                />
            ) : (
                <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="relative">
                        <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
                        <div className="relative w-28 h-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-full flex items-center justify-center shadow-2xl border border-white/10 group-hover:border-primary/30 transition-all duration-700 overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <User className="text-slate-600 w-14 h-14 group-hover:text-primary/70 transition-all duration-500 group-hover:scale-110" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase opacity-40 group-hover:opacity-100 transition-all duration-700">
                            Camera Off
                        </div>
                        <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full w-full bg-primary/20 animate-shimmer" />
                        </div>
                    </div>
                </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Name/Status Label */}
            <div className="absolute bottom-6 left-6 flex items-center gap-3 pl-2 pr-5 py-2.5 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-out">
                <div className="relative">
                    <div className={cn("w-2.5 h-2.5 rounded-full", isLocal ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]")} />
                    <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20", isLocal ? "bg-emerald-500" : "bg-primary")} />
                </div>
                <span className="text-white text-[13px] font-bold tracking-tight">
                    {userName || (isLocal ? 'You' : `User ${userId.slice(0, 4)}`)}
                    {screenTrack && <span className="ml-2 text-primary font-black animate-pulse">● SCREEN</span>}
                </span>
                {showMicOff && <MicOff className="w-4 h-4 text-rose-500/90 ml-2" />}
            </div>

            {/* Microphone Status (Floating) */}
            {showMicOff && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-6 left-6 p-3 bg-rose-500/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-rose-500/20"
                >
                    <MicOff className="w-5 h-5 text-rose-500" />
                </motion.div>
            )}

            {/* Pin Action */}
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-4 group-hover:translate-x-0">
                <button
                    onClick={togglePin}
                    className={cn(
                        "p-3.5 rounded-2xl backdrop-blur-2xl border-2 transition-all duration-500 shadow-2xl hover:scale-105 active:scale-90",
                        isPinned
                            ? "bg-primary border-primary/50 text-white shadow-primary/20"
                            : "bg-white/5 border-white/10 text-slate-300 hover:border-primary/50 hover:text-white"
                    )}
                >
                    {isPinned ? <PinOff className="w-6 h-6" /> : <Pin className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
};
