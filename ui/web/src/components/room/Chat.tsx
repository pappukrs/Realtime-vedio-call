"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, MessageCircle, X } from 'lucide-react';
import { useRoomStore } from '@/store/useRoomStore';
import { clsx } from 'clsx';

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
        <div className="flex flex-col h-full w-80 bg-white border-l border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <h2 className="font-bold text-slate-800">Room Chat</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            {/* Recipient Selector */}
            <div className="p-3 border-b border-slate-50">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Send To
                </label>
                <select
                    value={recipientId || ''}
                    onChange={(e) => setRecipientId(e.target.value || null)}
                    className="w-full p-2 bg-slate-100 border-none rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                    <option value="">Everyone</option>
                    {participantList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                        <MessageCircle className="w-12 h-12 mb-2" />
                        <p className="text-sm font-medium">No messages yet</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.senderId === socket.id;
                        return (
                            <div
                                key={i}
                                className={clsx(
                                    "flex flex-col max-w-[85%]",
                                    isMe ? "ml-auto items-end" : "items-start"
                                )}
                            >
                                <div className="flex items-center gap-1 mb-1 px-1">
                                    {!isMe && <span className="text-[10px] font-bold text-slate-500">{msg.senderName}</span>}
                                    {msg.isPrivate && (
                                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                            Private
                                        </span>
                                    )}
                                </div>
                                <div
                                    className={clsx(
                                        "p-3 rounded-2xl text-sm break-words shadow-sm",
                                        isMe
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-slate-100 text-slate-800 rounded-tl-none"
                                    )}
                                >
                                    {msg.message}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1 px-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={recipientId ? "Type a private message..." : "Message everyone..."}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!message.trim()}
                        className="absolute right-1.5 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};
