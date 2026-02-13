"use client";

import { useState, useEffect } from 'react';
import { User, Video } from 'lucide-react';

interface NameInputModalProps {
    onSubmit: (name: string) => void;
    roomId: string;
}

export const NameInputModal = ({ onSubmit, roomId }: NameInputModalProps) => {
    const [name, setName] = useState('');
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Try to load saved name from localStorage
        const savedName = localStorage.getItem('userName');
        if (savedName) {
            setName(savedName);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (trimmedName) {
            localStorage.setItem('userName', trimmedName);
            setIsVisible(false);
            onSubmit(trimmedName);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-300">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Video className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Join Room</h2>
                        <p className="text-sm text-slate-500">Room: <span className="font-mono text-blue-600">{roomId}</span></p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                            Your Name
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <User className="w-5 h-5" />
                            </div>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400"
                                autoFocus
                                maxLength={30}
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                            This name will be visible to other participants
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Join Call
                    </button>
                </form>

                {/* Info */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs text-blue-800">
                        <span className="font-semibold">Tip:</span> Make sure your camera and microphone are ready before joining.
                    </p>
                </div>
            </div>
        </div>
    );
};
