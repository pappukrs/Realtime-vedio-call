import { create } from 'zustand';

interface Participant {
    userId: string;
    userName?: string;
    videoTrack?: MediaStreamTrack;
    audioTrack?: MediaStreamTrack;
    screenTrack?: MediaStreamTrack;
    isLocal: boolean;
    isVideoPaused?: boolean;
    isAudioPaused?: boolean;
}

interface ChatMessage {
    senderId: string;
    senderName: string;
    message: string;
    timestamp: string;
    isPrivate: boolean;
}

interface RoomState {
    roomId: string | null;
    userId: string | null;
    participants: Map<string, Participant>;
    messages: ChatMessage[];
    pinnedParticipantId: string | null;
    layout: 'grid' | 'spotlight';
    setRoomId: (roomId: string) => void;
    setUserId: (userId: string) => void;
    setPinnedParticipant: (userId: string | null) => void;
    toggleLayout: () => void;
    addParticipant: (userId: string, participant: Participant) => void;
    upsertParticipant: (userId: string, data: Partial<Participant>) => void;
    setLocalUserName: (userName: string) => void;
    removeParticipant: (userId: string) => void;
    updateParticipantTracks: (userId: string, kind: 'video' | 'audio' | 'screen', track: MediaStreamTrack | undefined) => void;
    updateParticipantPausedState: (userId: string, kind: 'video' | 'audio', paused: boolean) => void;
    addMessage: (message: ChatMessage) => void;
    clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
    roomId: null,
    userId: null,
    participants: new Map(),
    messages: [],
    pinnedParticipantId: null,
    layout: 'grid',
    setRoomId: (roomId) => set({ roomId }),
    setUserId: (userId) => set({ userId }),
    setPinnedParticipant: (userId) => set({ pinnedParticipantId: userId }),
    toggleLayout: () => set((state) => ({ layout: state.layout === 'grid' ? 'spotlight' : 'grid' })),

    addParticipant: (userId, participant) =>
        set((state) => {
            const newParticipants = new Map(state.participants);
            newParticipants.set(userId, participant);
            return { participants: newParticipants };
        }),

    upsertParticipant: (userId, data) =>
        set((state) => {
            const newParticipants = new Map(state.participants);
            const existing = newParticipants.get(userId);
            if (existing) {
                newParticipants.set(userId, { ...existing, ...data });
            } else {
                newParticipants.set(userId, {
                    userId,
                    isLocal: false,
                    ...data
                } as Participant);
            }
            return { participants: newParticipants };
        }),

    setLocalUserName: (userName) =>
        set((state) => {
            const newParticipants = new Map(state.participants);
            const local = newParticipants.get('local');
            if (local) {
                newParticipants.set('local', { ...local, userName });
            }
            return { participants: newParticipants };
        }),

    removeParticipant: (userId) =>
        set((state) => {
            const newParticipants = new Map(state.participants);
            newParticipants.delete(userId);
            const newPinnedId = state.pinnedParticipantId === userId ? null : state.pinnedParticipantId;
            return { participants: newParticipants, pinnedParticipantId: newPinnedId };
        }),

    updateParticipantTracks: (userId, kind, track) =>
        set((state) => {
            const participant = state.participants.get(userId);
            if (!participant) return state;

            const updatedParticipant = {
                ...participant,
                ...(kind === 'video' ? { videoTrack: track } :
                    kind === 'audio' ? { audioTrack: track } :
                        { screenTrack: track })
            };

            const newParticipants = new Map(state.participants);
            newParticipants.set(userId, updatedParticipant);
            return { participants: newParticipants };
        }),

    updateParticipantPausedState: (userId, kind, paused) =>
        set((state) => {
            const participant = state.participants.get(userId);
            if (!participant) return state;

            const updatedParticipant = {
                ...participant,
                ...(kind === 'video' ? { isVideoPaused: paused } : { isAudioPaused: paused })
            };

            const newParticipants = new Map(state.participants);
            newParticipants.set(userId, updatedParticipant);
            return { participants: newParticipants };
        }),

    addMessage: (message) =>
        set((state) => ({
            messages: [...state.messages, message]
        })),

    clearRoom: () => set({
        roomId: null,
        participants: new Map(),
        messages: [],
        pinnedParticipantId: null,
        layout: 'grid'
    }),
}));
