"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Video, ArrowRight, Plus, Link as LinkIcon, Loader2, Shield, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const router = useRouter();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    let id = roomId.trim();

    try {
      if (id.startsWith('http')) {
        const url = new URL(id);
        const pathParts = url.pathname.split('/');
        const roomIdx = pathParts.indexOf('room');
        if (roomIdx !== -1 && pathParts[roomIdx + 1]) {
          id = pathParts[roomIdx + 1];
        }
      }
    } catch (err) {
      console.warn('Failed to parse roomId as URL, using raw input');
    }

    if (id) {
      router.push(`/room/${id}`);
    }
  };

  const handleCreateMeeting = async () => {
    setIsCreating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.post(`${apiUrl}/rooms`);

      if (response.data && response.data.roomId) {
        setCreatedRoomId(response.data.roomId);
        setIsCreating(false);
      } else {
        console.error('Invalid response from server:', response.data);
        alert('Failed to create meeting. Please try again.');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to connect to server. Please check your connection.');
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdRoomId || !origin) return;
    const url = `${origin}/room/${createdRoomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center selection:bg-primary/30 overflow-x-hidden bg-[#0a0e1a]">
      {/* Background with Image and Gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] animate-float" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <div className="w-11 h-11 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
            <Video className="text-white" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            LiveCall
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-400"
        >
          <a href="#" className="hover:text-white transition-colors">Product</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Enterprise</a>
          <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all hover:scale-105 active:scale-95">
            Log In
          </button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-16 py-12 lg:py-24">

        {/* Left Side: Text Content */}
        <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              v2.0 is now live
            </div>
            <h1 className="text-5xl xs:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] text-white">
              Video calls for <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-accent">modern teams.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg sm:text-xl text-slate-400 leading-relaxed font-medium"
          >
            Crystal clear audio and video conferencing that actually works.
            No plugins, no downloads, just one click to connect.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-8"
          >
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10"><Shield size={18} className="text-primary" /></div>
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10"><Zap size={18} className="text-primary" /></div>
              <span>Fast</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Action Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md lg:max-w-lg"
        >
          <div className="glass rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <AnimatePresence mode="wait">
              {!createdRoomId ? (
                <motion.div
                  key="create-join"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-8 relative z-10"
                >
                  <button
                    onClick={handleCreateMeeting}
                    disabled={isCreating}
                    className="w-full relative py-5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
                  >
                    <div className="relative flex items-center justify-center gap-3">
                      {isCreating ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <Plus size={22} className="group-hover:rotate-90 transition-transform duration-500" />
                      )}
                      <span>Start instant meeting</span>
                    </div>
                  </button>

                  <div className="relative flex items-center">
                    <div className="flex-grow h-[1px] bg-white/10"></div>
                    <span className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">or</span>
                    <div className="flex-grow h-[1px] bg-white/10"></div>
                  </div>

                  <form onSubmit={handleJoin} className="space-y-5">
                    <div className="relative group/input">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-primary transition-colors">
                        <LinkIcon size={20} />
                      </div>
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Paste meeting link or code"
                        className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.08] transition-all font-medium text-white placeholder:text-slate-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!roomId.trim()}
                      className="w-full bg-white text-[#0a0e1a] font-black py-5 rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-10 text-lg active:scale-95 shadow-xl shadow-white/5"
                    >
                      Join now
                      <ArrowRight size={22} />
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="meeting-ready"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-10 text-center relative z-10"
                >
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 shadow-inner">
                      <Zap className="text-primary" size={36} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white tracking-tight">You're all set!</h3>
                      <p className="text-slate-400 font-medium mt-2">Ready to start the conversation?</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="relative">
                      <input
                        readOnly
                        type="text"
                        value={origin ? `${origin}/room/${createdRoomId}` : ""}
                        className="w-full pl-6 pr-16 py-5 bg-white/5 border border-white/10 rounded-2xl text-primary font-mono text-sm truncate focus:outline-none"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 hover:bg-primary/20 rounded-xl transition-all text-primary"
                      >
                        {copied ? <span className="text-[10px] font-black uppercase">Copied!</span> : <LinkIcon size={20} />}
                      </button>
                    </div>

                    <div className="flex flex-col gap-4">
                      <button
                        onClick={() => router.push(`/room/${createdRoomId}`)}
                        className="w-full py-5 bg-primary hover:bg-primary-hover text-white font-black text-xl rounded-2xl transition-all active:scale-95 shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
                      >
                        Launch Meeting
                        <ArrowRight size={24} />
                      </button>
                      <button
                        onClick={() => setCreatedRoomId(null)}
                        className="text-slate-500 font-bold hover:text-slate-300 transition-colors py-2 text-sm"
                      >
                        Cancel and go back
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

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
    </main>
  );
}
