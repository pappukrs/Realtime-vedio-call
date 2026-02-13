"use client";

import { useEffect, useRef } from 'react';
import { Pin, PinOff, User, Mic, MicOff } from 'lucide-react';
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
    const setPinnedParticipant = useRoomStore((state) => state.setPinnedParticipant);
    const pinnedId = useRoomStore((state) => state.pinnedParticipantId);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let isPlaying = true;

        const updateStream = async () => {
            const tracks: MediaStreamTrack[] = [];
            // If screen sharing is active, show it. Otherwise show camera.
            const primaryTrack = screenTrack || (isVideoPaused ? undefined : videoTrack);

            if (primaryTrack) tracks.push(primaryTrack);
            if (audioTrack) tracks.push(audioTrack);

            if (tracks.length > 0) {
                const stream = new MediaStream(tracks);

                if (video.srcObject instanceof MediaStream) {
                    const currentTracks = video.srcObject.getTracks();
                    // Check if tracks effectively changed
                    const hasChanged = tracks.length !== currentTracks.length ||
                        tracks.some((t, i) => t.id !== currentTracks[i]?.id);
                    if (!hasChanged) return;
                }

                video.srcObject = stream;
                try {
                    await video.play();
                } catch (err: any) {
                    if (err.name !== 'AbortError' && isPlaying) {
                        console.error('Video play error:', err);
                        // If play failed, maybe retry or just log
                    }
                }
            } else {
                video.srcObject = null;
            }
        };

        updateStream();

        return () => {
            isPlaying = false;
        };
    }, [videoTrack, audioTrack, screenTrack, isVideoPaused]);

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
            "group relative w-full h-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 ring-2 ring-transparent bg-gradient-to-br from-slate-900 to-slate-800",
            isPinned && "ring-blue-500 shadow-xl"
        )}>
            {showVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted={isLocal} // Local user usually muted to self to avoid echo, but if audio is paused, track might be silent anyway.
                    playsInline
                    className={cn(
                        "w-full h-full object-cover transition-transform duration-500",
                        isPinned ? "scale-100" : "scale-[1.01] hover:scale-100",
                        screenTrack && "object-contain bg-black" // Handle screen aspect ratios better
                    )}
                />
            ) : (
                <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-700">
                        <User className="text-white w-10 h-10" />
                    </div>
                    <div className="text-slate-400 text-sm font-medium tracking-wide">
                        {isLocal
                            ? (isVideoPaused ? 'Camera paused' : 'Camera is off')
                            : `${userName || `User ${userId.slice(0, 4)}`}'s ${isVideoPaused ? 'camera paused' : 'camera off'}`
                        }
                    </div>
                </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Name/Status Label */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/50 shadow-lg translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <div className={cn("w-2 h-2 rounded-full", isLocal ? "bg-green-500 animate-pulse" : "bg-blue-500")} />
                <span className="text-white text-[11px] font-semibold tracking-tight">
                    {userName || (isLocal ? 'You' : `User ${userId.slice(0, 6)}`)}
                    {screenTrack && <span className="ml-2 text-blue-400 font-bold border border-blue-400/30 px-1.5 rounded-sm text-[9px]">SCREEN</span>}
                </span>
                {showMicOff && <MicOff className="w-3 h-3 text-rose-500 ml-1" />}
            </div>

            {/* Controls */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={togglePin}
                    className={cn(
                        "p-2 rounded-full backdrop-blur-md border transition-all duration-200 shadow-lg hover:scale-110 active:scale-95",
                        isPinned
                            ? "bg-blue-600 border-blue-400 text-white"
                            : "bg-slate-900/80 border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400"
                    )}
                    title={isPinned ? "Unpin participant" : "Pin participant"}
                >
                    {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
            </div>

            {/* Microphone Status (Always visible if muted) */}
            {showMicOff && (
                <div className="absolute top-3 left-3 p-2 bg-rose-600/90 backdrop-blur-sm rounded-full shadow-lg">
                    <MicOff className="w-4 h-4 text-white" />
                </div>
            )}
        </div>
    );
};
