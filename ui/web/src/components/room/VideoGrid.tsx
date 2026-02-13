"use client";

import { useRoomStore } from '@/store/useRoomStore';
import { ParticipantTile } from './ParticipantTile';

export const VideoGrid = () => {
    const participantsMap = useRoomStore((state) => state.participants);
    const pinnedId = useRoomStore((state) => state.pinnedParticipantId);
    const layout = useRoomStore((state) => state.layout);

    const participants = Array.from(participantsMap.values());

    console.log('VideoGrid render - participants:', participants.length, participants);

    const screenSharer = participants.find(p => p.screenTrack);

    // Determine which ID to spotlight if in spotlight mode
    // Either the user-pinned ID, or the screen sharer, or the first remote participant, or the local user
    const spotlightId = pinnedId ||
        screenSharer?.userId ||
        participants.find(p => !p.isLocal)?.userId ||
        participants[0]?.userId;

    const pinnedParticipant = spotlightId ? participantsMap.get(spotlightId) : null;
    const otherParticipants = spotlightId
        ? participants.filter(p => p.userId !== spotlightId)
        : participants;

    if (participants.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                <div className="text-center">
                    <div className="animate-pulse mb-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                            <span className="text-2xl">⏳</span>
                        </div>
                    </div>
                    <p className="text-lg font-medium">Waiting for participants to join...</p>
                    <p className="text-sm text-gray-400">Your camera will appear here shortly</p>
                </div>
            </div>
        );
    }

    // Spotlight View (either pinnedId exists OR layout is 'spotlight')
    if ((pinnedId || layout === 'spotlight') && pinnedParticipant) {
        return (
            <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-900 overflow-hidden">
                {/* Main Spotlight View */}
                <div className="flex-1 p-4 md:p-6 flex items-center justify-center min-h-0 bg-slate-950">
                    <div className="w-full h-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden border border-slate-800">
                        <ParticipantTile
                            userId={pinnedParticipant.userId}
                            videoTrack={pinnedParticipant.videoTrack}
                            audioTrack={pinnedParticipant.audioTrack}
                            screenTrack={pinnedParticipant.screenTrack}
                            isLocal={pinnedParticipant.isLocal}
                            isPinned={true}
                            isVideoPaused={pinnedParticipant.isVideoPaused}
                            isAudioPaused={pinnedParticipant.isAudioPaused}
                        />
                    </div>
                </div>

                {/* Sidebar for others */}
                {otherParticipants.length > 0 && (
                    <div className="w-full md:w-80 md:h-full p-4 overflow-x-auto md:overflow-y-auto bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-row md:flex-col gap-4">
                        {otherParticipants.map((p) => (
                            <div key={p.userId} className="w-60 md:w-full shrink-0 aspect-video md:aspect-[16/10]">
                                <ParticipantTile
                                    userId={p.userId}
                                    videoTrack={p.videoTrack}
                                    audioTrack={p.audioTrack}
                                    screenTrack={p.screenTrack}
                                    isLocal={p.isLocal}
                                    isPinned={false}
                                    isVideoPaused={p.isVideoPaused}
                                    isAudioPaused={p.isAudioPaused}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Standard Grid View
    return (
        <div className="flex-1 p-4 md:p-8 bg-slate-50 overflow-auto">
            <div className={`grid gap-4 md:gap-8 auto-rows-fr h-full max-w-7xl mx-auto ${participants.length === 1 ? 'grid-cols-1 max-w-4xl' :
                participants.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    participants.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' :
                        participants.length <= 6 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                            'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                }`}>
                {participants.map((p) => (
                    <div key={p.userId} className="w-full h-full min-h-[220px] shadow-sm hover:shadow-xl rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.01] bg-white border border-slate-200">
                        <ParticipantTile
                            userId={p.userId}
                            videoTrack={p.videoTrack}
                            audioTrack={p.audioTrack}
                            screenTrack={p.screenTrack}
                            isLocal={p.isLocal}
                            isPinned={false}
                            isVideoPaused={p.isVideoPaused}
                            isAudioPaused={p.isAudioPaused}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
