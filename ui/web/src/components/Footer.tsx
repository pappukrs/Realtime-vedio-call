"use client";

import { Video } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative z-10 w-full py-12 border-t border-white/5 mt-auto bg-black/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                    <Video className="text-primary" size={20} />
                    <span className="text-sm font-bold text-slate-500">© 2026 LiveCall Inc.</span>
                </div>
                <div className="flex gap-10 opacity-60 grayscale hover:grayscale-0 transition-all">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">4K Video</span>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Noise Removal</span>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Collaborative</span>
                </div>
            </div>
        </footer>
    );
}
