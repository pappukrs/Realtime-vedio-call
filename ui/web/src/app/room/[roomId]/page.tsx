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
        <main className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {isMounted && !userName && <NameInputModal onSubmit={handleNameSubmit} roomId={roomId} />}
            {/* Header */}
            <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Video className="text-white w-5 h-5" />
                    </div>
                    <h1 className="text-base font-bold text-slate-900 tracking-tight">
                        Live Room: <span className="text-blue-600 font-mono">{roomId}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`p-2 rounded-lg transition-all ${isChatOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <div className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-200">
                        HD ACTIVE
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative flex overflow-hidden">
                <div className="flex-1 relative flex flex-col min-h-0 min-w-0">
                    <VideoGrid />
                </div>

                {isParticipantsOpen && (
                    <ParticipantList onClose={() => setIsParticipantsOpen(false)} />
                )}

                {isChatOpen && socket && roomId && userName && (
                    <Chat
                        socket={socket}
                        roomId={roomId}
                        userName={userName}
                        onClose={() => setIsChatOpen(false)}
                    />
                )}
            </div>

            {/* Bottom Controls Area */}
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
