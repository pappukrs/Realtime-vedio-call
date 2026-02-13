"use client";

import { useRoomStore } from '@/store/useRoomStore';
import { ParticipantTile } from './ParticipantTile';
import { cn } from '@/lib/utils';

export const VideoGrid = () => {
    const participantsMap = useRoomStore((state) => state.participants);
    const pinnedParticipantId = useRoomStore((state) => state.pinnedParticipantId);

    const participants = Array.from(participantsMap.values());

    // Preparation/Loading state
    if (participants.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#050811] premium-gradient">
                <div className="relative">
                    <div className="absolute -inset-10 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="relative w-20 h-20 border-[3px] border-primary/10 border-t-primary rounded-full animate-spin" />
                </div>
                <div className="mt-12 flex flex-col items-center gap-3">
                    <p className="text-white font-bold uppercase tracking-[0.4em] text-[11px] animate-pulse">
                        Securing Connection
                    </p>
                    <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-primary/30 animate-shimmer" />
                    </div>
                </div>
            </div>
        );
    }

    // Spotlight logic
    const pinnedParticipant = pinnedParticipantId ? participantsMap.get(pinnedParticipantId) : null;
    const regularParticipants = participants.filter(p => p.userId !== pinnedParticipantId);

    return (
        <div className="flex-1 p-8 md:p-12 lg:p-16 bg-[#050811] overflow-hidden flex items-center justify-center">
            <div className={cn(
                "grid gap-6 md:gap-10 w-full max-w-[1700px] mx-auto auto-rows-fr h-full max-h-[900px]",
                pinnedParticipant ? "grid-cols-1 lg:grid-cols-4" :
                    participants.length === 1 ? "max-w-5xl aspect-video" :
                        participants.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-7xl" :
                            participants.length <= 4 ? "grid-cols-2" :
                                participants.length <= 6 ? "grid-cols-2 lg:grid-cols-3" :
                                    "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            )}>
                {pinnedParticipant && (
                    <div className="lg:col-span-3 h-full">
                        <ParticipantTile
                            {...pinnedParticipant}
                            isPinned={true}
                        />
                    </div>
                )}

                {regularParticipants.map((participant) => (
                    <div key={participant.userId} className={cn(
                        "h-full",
                        pinnedParticipant && "lg:col-span-1"
                    )}>
                        <ParticipantTile
                            {...participant}
                            isPinned={false}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
