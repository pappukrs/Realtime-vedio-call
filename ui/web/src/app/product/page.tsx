"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Cpu, Shield, Zap, Globe, Users, Headphones } from 'lucide-react';

const features = [
    {
        icon: <Cpu className="text-primary" size={32} />,
        title: "AI-Powered Noise Cancellation",
        description: "Our advanced neural networks filter out background noise in real-time for crystal clear conversations."
    },
    {
        icon: <Shield className="text-primary" size={32} />,
        title: "End-to-End Encryption",
        description: "Your meetings are your business. We use state-of-the-art E2EE for all audio, video, and data streams."
    },
    {
        icon: <Zap className="text-primary" size={32} />,
        title: "Ultra-Low Latency",
        description: "Powered by Mediasoup and global edge nodes, enjoy seamless interaction with zero lag."
    },
    {
        icon: <Globe className="text-primary" size={32} />,
        title: "Global Infrastructure",
        description: "Connect from anywhere with a stable connection, powered by our distributed server network."
    },
    {
        icon: <Users className="text-primary" size={32} />,
        title: "Large Scale Meetings",
        description: "Host up to 100 participants with high-definition video and collaborative tools."
    },
    {
        icon: <Headphones className="text-primary" size={32} />,
        title: "Spatial Audio",
        description: "Experience natural conversations with audio that feels like you're in the same room."
    }
];

export default function ProductPage() {
    return (
        <>
            <Navbar />
            <main className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-6 py-12 md:py-24">
                <div className="text-center space-y-4 md:space-y-6 mb-16 md:mb-24">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter"
                    >
                        Built for <span className="text-primary">Performance.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium"
                    >
                        Experience the future of video communication with our state-of-the-art infrastructure and AI-driven features.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass p-8 md:p-10 rounded-[2rem] border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                                    <div className="text-primary">{feature.icon}</div>
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-white mb-4 tracking-tight">{feature.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
            <Footer />
        </>
    );
}
