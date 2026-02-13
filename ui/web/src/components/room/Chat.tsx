"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, MessageCircle, X, MessageSquare } from 'lucide-react';
import { useRoomStore } from '@/store/useRoomStore';
import { cn } from '@/lib/utils';

interface ChatProps {
    socket: any;
    roomId: string;
    userName: string;
    onClose: () => void;
}

export const Chat: React.FC<ChatProps> = ({ socket, roomId, userName, onClose }) => {
    const [message, setMessage] = useState('');
    const [recipientId, setRecipientId] = useState<string | null>(null);
    const messages = useRoomStore((state) => state.messages);
    const participants = useRoomStore((state) => state.participants);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        socket.emit('sendMessage', {
            roomId,
            recipientId,
            message: message.trim(),
            senderName: userName
        });

        setMessage('');
    };

    const participantList = Array.from(participants.entries())
        .filter(([id]) => id !== 'local')
        .map(([id, p]) => ({ id, name: p.userName || 'Anonymous' }));

    return (
        <div className="flex flex-col h-full w-[360px] bg-[#0a0e1a]/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <MessageCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white tracking-tight">Messages</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">
                            {participantList.length + 1} participants
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 group"
                >
                    <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </button>
            </div>

            {/* Recipient Selector */}
            <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">
                    Message Target
                </label>
                <div className="relative group">
                    <select
                        value={recipientId || ''}
                        onChange={(e) => setRecipientId(e.target.value || null)}
                        className="w-full pl-4 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all appearance-none cursor-pointer hover:bg-white/10"
                    >
                        <option value="" className="bg-[#0a0e1a]">Everyone</option>
                        {participantList.map(p => (
                            <option key={p.id} value={p.id} className="bg-[#0a0e1a]">{p.name}</option>
                        ))}
                    </select>
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-slate-300 transition-colors" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                            <MessageSquare className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-sm font-semibold text-slate-400">No messages yet</p>
                        <p className="text-[11px] text-slate-600 mt-1 max-w-[150px]">Be the first to say hello to everyone!</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.senderId === socket.id;
                        return (
                            <div
                                key={i}
                                className={cn(
                                    "flex flex-col max-w-[90%] group",
                                    isMe ? "ml-auto items-end" : "items-start"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1.5 px-1">
                                    {!isMe && <span className="text-[11px] font-bold text-slate-400 truncate max-w-[120px]">{msg.senderName}</span>}
                                    {msg.isPrivate && (
                                        <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg border border-amber-500/20 font-black uppercase tracking-wider">
                                            Secret
                                        </span>
                                    )}
                                    <span className="text-[9px] text-slate-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div
                                    className={cn(
                                        "p-3.5 rounded-2xl text-[13px] leading-relaxed break-words shadow-lg border",
                                        isMe
                                            ? "bg-primary border-primary/20 text-white rounded-tr-none shadow-primary/10"
                                            : "bg-white/5 border-white/10 text-slate-200 rounded-tl-none"
                                    )}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-6 border-t border-white/10 bg-white/[0.02]">
                <div className="relative flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={recipientId ? "Secret message..." : "Message team..."}
                            className="w-full pl-5 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-primary/20 active:scale-90"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <p className="text-[10px] text-center text-slate-600 mt-4 font-medium italic">
                    Press Enter to send
                </p>
            </form>
        </div>
    );
};
