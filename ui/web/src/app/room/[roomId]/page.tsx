"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Video, MessageSquare } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useMediasoup } from '@/hooks/useMediasoup';
import { VideoGrid } from '@/components/room/VideoGrid';
import { Controls } from '@/components/room/Controls';
import { NameInputModal } from '@/components/room/NameInputModal';
import { Chat } from '@/components/room/Chat';
import { ParticipantList } from '@/components/room/ParticipantList';
import { useRoomStore } from '@/store/useRoomStore';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const socket = useSocket(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');
    const [userName, setUserName] = useState<string | null>(null);
    const [hasJoined, setHasJoined] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const {
        startScreenShare,
        stopScreenShare,
        isScreenSharing,
        toggleMic,
        toggleVideo,
        isMicOn,
        isVideoOn
    } = useMediasoup(socket, roomId);

    const setRoomId = useRoomStore((state) => state.setRoomId);
    const setLocalUserName = useRoomStore((state) => state.setLocalUserName);
    const addMessage = useRoomStore((state) => state.addMessage);
    const clearRoom = useRoomStore((state) => state.clearRoom);
    const upsertParticipant = useRoomStore((state) => state.upsertParticipant);

    // Socket message listener
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (data: any) => {
            console.log('Message received:', data);
            addMessage(data);
        };

        socket.on('messageReceived', handleMessage);
        return () => {
            socket.off('messageReceived', handleMessage);
        };
    }, [socket, addMessage]);

    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleNameSubmit = (name: string) => {
        setUserName(name);
    };

    // Join room when userName is set
    useEffect(() => {
        if (socket && roomId && userName && !hasJoined) {
            const handleConnect = () => {
                if (!socket.id) {
                    console.warn('Socket connected but no ID yet, retrying...');
                    return;
                }
                console.log('Socket connected, joining room:', socket.id, 'as', userName);
                setRoomId(roomId);

                socket.emit('joinRoom', { roomId, userId: socket.id, userName }, (data: any) => {
                    if (data && data.error) {
                        console.error('Join room failed:', data.error);
                    } else {
                        setHasJoined(true);
                        // Set the local participant's userName after joining
                        setLocalUserName(userName);

                        // Add existing participants returned by the server
                        if (data && data.participants && Array.isArray(data.participants)) {
                            console.log('📋 Existing participants in room:', data.participants);
                            data.participants.forEach((p: { userId: string; userName: string; socketId: string }) => {
                                upsertParticipant(p.userId, {
                                    userId: p.userId,
                                    userName: p.userName,
                                    isLocal: false
                                });
                            });
                        }
                    }
                });
            };

            if (socket.connected && socket.id) {
                handleConnect();
            } else {
                socket.on('connect', handleConnect);
            }

            return () => {
                socket.off('connect', handleConnect);
            };
        }
    }, [socket, roomId, userName, hasJoined, setRoomId, setLocalUserName, upsertParticipant]);

    // Cleanup only on actual unmount (when navigating away)
    useEffect(() => {
        return () => {
            if (socket && socket.id && roomId) {
                console.log('Component unmounting, leaving room');
                socket.emit('leaveRoom', { roomId, userId: socket.id });
            }
        };
    }, []); // Empty deps - only run on mount/unmount

    return (
        <main className="flex flex-col h-screen bg-[#0a0e1a] text-slate-200 overflow-hidden relative">
            {isMounted && !userName && <NameInputModal onSubmit={handleNameSubmit} roomId={roomId} />}

            {/* Immersive Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/20 backdrop-blur-2xl z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Video className="text-white w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black text-white tracking-widest uppercase">
                            Room: <span className="text-primary">{roomId.slice(0, 8)}</span>
                        </h1>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Encrypted • P2P Optimized</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter">HD Active</span>
                    </div>
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`p-2.5 rounded-xl transition-all border ${isChatOpen ? 'bg-primary border-primary/50 text-white' : 'hover:bg-white/5 border-white/10 text-slate-400'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative flex overflow-hidden">
                <div className="flex-1 relative flex flex-col min-h-0 min-w-0">
                    <VideoGrid />
                </div>

                {isParticipantsOpen && (
                    <div className="w-96 bg-black/40 backdrop-blur-3xl border-l border-white/5 animate-in slide-in-from-right duration-500 z-30">
                        <ParticipantList onClose={() => setIsParticipantsOpen(false)} />
                    </div>
                )}

                {isChatOpen && socket && roomId && userName && (
                    <div className="w-96 bg-black/40 backdrop-blur-3xl border-l border-white/5 animate-in slide-in-from-right duration-500 z-30">
                        <Chat
                            socket={socket}
                            roomId={roomId}
                            userName={userName}
                            onClose={() => setIsChatOpen(false)}
                        />
                    </div>
                )}
            </div>

            {/* Floating Controls Area */}
            <Controls
                onStartScreenShare={startScreenShare}
                onStopScreenShare={stopScreenShare}
                isScreenSharing={isScreenSharing}
                isChatOpen={isChatOpen}
                onToggleChat={() => setIsChatOpen(!isChatOpen)}
                isParticipantsOpen={isParticipantsOpen}
                onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
                onToggleMic={toggleMic}
                onToggleVideo={toggleVideo}
                micOn={isMicOn}
                videoOn={isVideoOn}
            />
        </main>
    );
}
