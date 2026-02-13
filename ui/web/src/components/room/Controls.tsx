"use client";

import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    ScreenShare, StopCircle, MessageSquare, Users,
    Copy, Settings, Check, FileText
} from 'lucide-react';
import { useState } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface ControlsProps {
    onStartScreenShare: () => void;
    onStopScreenShare: () => void;
    isScreenSharing: boolean;
    isChatOpen: boolean;
    onToggleChat: () => void;
    isParticipantsOpen: boolean;
    onToggleParticipants: () => void;
    onToggleMic: () => void;
    onToggleVideo: () => void;
    micOn: boolean;
    videoOn: boolean;
}

export const Controls = ({
    onStartScreenShare,
    onStopScreenShare,
    isScreenSharing,
    isChatOpen,
    onToggleChat,
    isParticipantsOpen,
    onToggleParticipants,
    onToggleMic,
    onToggleVideo,
    micOn,
    videoOn
}: ControlsProps) => {
    const [copied, setCopied] = useState(false);
    const roomId = useRoomStore((state) => state.roomId);

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-24 bg-[#050811]/95 backdrop-blur-xl border-t border-white/10 px-6 sm:px-10 flex items-center justify-between z-50">
            {/* Left Info: Meeting Details */}
            <div className="flex items-center gap-6 w-1/4 min-w-[200px]">
                <div className="hidden lg:flex flex-col gap-1">
                    <span className="text-white text-base font-semibold tracking-tight">
                        Live Session
                    </span>
                    <span className="text-slate-500 text-[11px] font-medium tracking-[0.1em] uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {roomId?.slice(0, 8)}
                    </span>
                </div>
            </div>

            {/* Center: Main Controls */}
            <div className="flex items-center gap-3 sm:gap-6 justify-center flex-1">
                <button
                    onClick={onToggleMic}
                    className={cn(
                        "h-14 w-14 sm:w-20 rounded-2xl flex items-center justify-center btn-hover-effect border-2 transition-all",
                        micOn
                            ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            : "bg-rose-500/90 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                    )}
                    title={micOn ? "Mute Microphone" : "Unmute Microphone"}
                >
                    {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>

                <button
                    onClick={onToggleVideo}
                    className={cn(
                        "h-14 w-14 sm:w-20 rounded-2xl flex items-center justify-center btn-hover-effect border-2 transition-all",
                        videoOn
                            ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            : "bg-rose-500/90 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                    )}
                    title={videoOn ? "Stop Video" : "Start Video"}
                >
                    {videoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>

                <button
                    onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
                    className={cn(
                        "h-14 w-14 sm:w-20 rounded-2xl flex items-center justify-center btn-hover-effect border-2 transition-all",
                        isScreenSharing
                            ? "bg-emerald-500/90 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    )}
                    title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                >
                    {isScreenSharing ? <StopCircle className="w-6 h-6" /> : <ScreenShare className="w-6 h-6" />}
                </button>

                <div className="w-[1px] h-10 bg-white/10 mx-2 hidden sm:block" />

                <button
                    onClick={() => window.location.href = '/'}
                    className="h-14 px-8 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-rose-500/30 border-2 border-rose-400/20"
                    title="Leave Meeting"
                >
                    <PhoneOff className="w-6 h-6" />
                    <span className="hidden md:block text-sm uppercase tracking-wider">Leave</span>
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-4 w-1/4">
                <button
                    onClick={() => logger.downloadLogs()}
                    className="p-3.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/10 group relative"
                    title="Download Debug Logs"
                >
                    <FileText className="w-6 h-6" />
                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-2xl">
                        Download Session Logs
                    </span>
                </button>

                <button
                    onClick={copyLink}
                    className="p-3.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/10 group relative"
                    title="Copy Meeting Link"
                >
                    {copied ? <Check className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6" />}
                    {copied && (
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-semibold rounded-lg opacity-100 transition-opacity whitespace-nowrap shadow-2xl">
                            Copied!
                        </span>
                    )}
                </button>

                <div className="w-[1px] h-8 bg-white/10 mx-1 hidden lg:block" />

                <button
                    onClick={onToggleParticipants}
                    className={cn(
                        "p-3.5 rounded-2xl transition-all border-2",
                        isParticipantsOpen ? "bg-primary border-primary/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                    title="Participants"
                >
                    <Users className="w-6 h-6" />
                </button>

                <button
                    onClick={onToggleChat}
                    className={cn(
                        "p-3.5 rounded-2xl transition-all border-2",
                        isChatOpen ? "bg-primary border-primary/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                    title="Chat"
                >
                    <MessageSquare className="w-6 h-6" />
                </button>

                <button
                    className="p-3.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/10"
                    title="Settings"
                >
                    <Settings className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
