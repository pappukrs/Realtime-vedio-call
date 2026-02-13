"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, ArrowRight, Plus, Link as LinkIcon, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    let id = roomId.trim();

    // Extract roomId if a full URL was pasted
    try {
      if (id.startsWith('http')) {
        const url = new URL(id);
        const pathParts = url.pathname.split('/');
        // Format is /room/[roomId]
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
      // Direct call to API Gateway which proxies to Signaling Service
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await axios.post(`${apiUrl}/rooms`);

      if (response.data && response.data.roomId) {
        router.push(`/room/${response.data.roomId}`);
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

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center justify-center">

        {/* Left Side: Hero */}
        <div className="space-y-6 text-center md:text-left">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
            <Video className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Premium Video Calls <br className="hidden md:block" />
            <span className="text-blue-600">Made Simple.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-md mx-auto md:mx-0">
            Connect instantly with crystal clear video and audio. No sign-up required. Just create a link and share.
          </p>
        </div>

        {/* Right Side: Action Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 w-full max-w-md mx-auto">
          <div className="space-y-6">

            {/* New Meeting Button */}
            <button
              onClick={handleCreateMeeting}
              disabled={isCreating}
              className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isCreating ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              )}
              <span className="text-lg">New Meeting</span>
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium uppercase tracking-wider">or join via link</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Join Form */}
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <LinkIcon size={20} />
                </div>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter code or link"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={!roomId.trim()}
                className="w-full bg-slate-100 text-slate-600 font-semibold py-3.5 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-slate-400 text-sm">
        <p>Powered by Mediasoup SFU • Secure & Private</p>
      </div>
    </main>
  );
}
