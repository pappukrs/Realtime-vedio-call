"use client";

import React from 'react';
import { X, Users, Mic, MicOff, Video, VideoOff, Monitor } from 'lucide-react';
import { useRoomStore } from '@/store/useRoomStore';

interface ParticipantListProps {
    onClose: () => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ onClose }) => {
    const participantsMap = useRoomStore((state) => state.participants);
    const participants = Array.from(participantsMap.values());

    return (
        <div className="flex flex-col h-full w-80 bg-white border-l border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h2 className="font-bold text-slate-800">
                        People
                        <span className="ml-2 text-sm font-normal text-slate-500">
                            ({participants.length})
                        </span>
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            {/* Participants */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {participants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                        <Users className="w-12 h-12 mb-2" />
                        <p className="text-sm font-medium">No participants yet</p>
                    </div>
                ) : (
                    participants.map((p) => (
                        <div
                            key={p.userId}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${p.isLocal
                                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-500'
                                    : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                                }`}>
                                {(p.userName || (p.isLocal ? 'You' : 'U')).charAt(0).toUpperCase()}
                            </div>

                            {/* Name & Status */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-semibold text-slate-800 truncate">
                                        {p.userName || (p.isLocal ? 'You' : `User ${p.userId.slice(0, 6)}`)}
                                    </span>
                                    {p.isLocal && (
                                        <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter shrink-0">
                                            You
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {p.screenTrack && (
                                        <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5">
                                            <Monitor className="w-3 h-3" />
                                            Presenting
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Media Status Icons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {p.audioTrack ? (
                                    <Mic className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <MicOff className="w-4 h-4 text-rose-500" />
                                )}
                                {p.videoTrack ? (
                                    <Video className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <VideoOff className="w-4 h-4 text-rose-500" />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
