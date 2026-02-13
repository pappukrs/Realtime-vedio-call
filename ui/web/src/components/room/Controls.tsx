"use client";

import { Mic, MicOff, Video, VideoOff, PhoneOff, LayoutGrid, Maximize2, MoreVertical, MessageSquare, Users, Monitor, MonitorOff, Link, Check } from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useRoomStore } from '@/store/useRoomStore';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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
    const toggleLayout = useRoomStore((state) => state.toggleLayout);
    const layout = useRoomStore((state) => state.layout);
    const participantsMap = useRoomStore((state) => state.participants);
    const roomId = useRoomStore((state) => state.roomId);
    const participantCount = participantsMap.size;
    const [copied, setCopied] = useState(false);

    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-24 bg-white border-t border-slate-200 px-6 flex items-center justify-between shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
            {/* Left side info */}
            <div className="hidden md:flex items-center gap-4 w-1/4">
                <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-600 text-sm font-medium tracking-tight">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-800 text-sm font-bold">In Call</span>
                </div>
            </div>

            {/* Main Controls - Center */}
            <div className="flex items-center gap-3 md:gap-5">
                <ControlBtn
                    active={micOn}
                    onClick={onToggleMic}
                    icon={micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-rose-500" />}
                    danger={!micOn}
                    label="Toggle Mic"
                />

                <ControlBtn
                    active={videoOn}
                    onClick={onToggleVideo}
                    icon={videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-rose-500" />}
                    danger={!videoOn}
                    label="Toggle Video"
                />

                <ControlBtn
                    active={!isScreenSharing}
                    onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
                    icon={isScreenSharing ? <MonitorOff className="w-5 h-5 text-rose-500" /> : <Monitor className="w-5 h-5" />}
                    danger={isScreenSharing}
                    label={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                />

                <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" />

                <ControlBtn
                    active={layout === 'grid'}
                    onClick={toggleLayout}
                    icon={<LayoutGrid className="w-5 h-5" />}
                    label={layout === 'grid' ? "Switch to Spotlight" : "Switch to Grid"}
                />

                <ControlBtn
                    active={false}
                    onClick={() => window.location.href = '/'}
                    icon={<PhoneOff className="w-5 h-5" />}
                    className="bg-rose-600 border-rose-500 text-white hover:bg-rose-700 hover:border-rose-600 w-14 h-14 md:w-16 md:h-16"
                    label="End Call"
                />
            </div>

            {/* Right side utils */}
            <div className="hidden md:flex items-center justify-end gap-2 w-1/4">
                <UtilBtn
                    icon={copied ? <Check className="w-5 h-5 text-green-500" /> : <Link className="w-5 h-5" />}
                    onClick={copyLink}
                    active={copied}
                    label={copied ? "Copied!" : "Copy Joining Link"}
                />
                <UtilBtn
                    icon={
                        <div className="relative">
                            <Users className="w-5 h-5" />
                            {participantCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {participantCount}
                                </span>
                            )}
                        </div>
                    }
                    onClick={onToggleParticipants}
                    active={isParticipantsOpen}
                />
                <UtilBtn
                    icon={<MessageSquare className="w-5 h-5" />}
                    onClick={onToggleChat}
                    active={isChatOpen}
                />
                <UtilBtn icon={<MoreVertical className="w-5 h-5" />} />
            </div>
        </div>
    );
};

const ControlBtn = ({ active, onClick, icon, danger, className, label }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "relative flex items-center justify-center rounded-2xl transition-all duration-300 border shadow-sm group",
            active && !danger
                ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-blue-400 hover:text-blue-600"
                : "bg-slate-900 border-slate-800 text-white hover:bg-slate-800",
            danger && "bg-rose-50 border-rose-200 hover:bg-rose-100",
            "w-12 h-12 md:w-14 md:h-14",
            className
        )}
        title={label}
    >
        {icon}
        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            {label}
        </span>
    </button>
);

const UtilBtn = ({ icon, onClick, active, label }: any) => (
    <button
        onClick={onClick}
        title={label}
        className={cn(
            "p-3 rounded-xl transition-all",
            active
                ? "bg-blue-50 text-blue-600 shadow-inner"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        )}
    >
        {icon}
    </button>
);
