"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Check, Zap, Rocket, Star } from 'lucide-react';

const plans = [
    {
        name: "Free",
        price: "$0",
        description: "Perfect for quick catch-ups and small teams.",
        icon: <Zap className="text-slate-400" size={24} />,
        features: ["Up to 40 mins per meeting", "10 participants", "Standard quality video", "Basic screen sharing"],
        buttonText: "Start for Free",
        popular: false
    },
    {
        name: "Pro",
        price: "$15",
        description: "Ideal for professional creators and growing businesses.",
        icon: <Star className="text-primary" size={24} />,
        features: ["Unlimited meeting duration", "50 participants", "4K Ultra HD video", "Advanced AI noise cancellation", "Custom meeting links"],
        buttonText: "Join Pro",
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Robust solutions for large-scale organizations.",
        icon: <Rocket className="text-blue-500" size={24} />,
        features: ["Up to 500 participants", "Single Sign-On (SSO)", "Priority 24/7 support", "Custom branding & domain", "Advanced security compliance"],
        buttonText: "Contact Sales",
        popular: false
    }
];

export default function PricingPage() {
    return (
        <>
            <Navbar />
            <main className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-6 py-12 md:py-24">
                <div className="text-center space-y-4 md:space-y-6 mb-16 md:mb-24">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter"
                    >
                        Simple, <span className="text-primary">Transparent</span> Pricing.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium"
                    >
                        Choose the plan that fits your needs. No hidden fees, ever.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`glass p-8 md:p-10 rounded-[2.5rem] border-white/5 relative flex flex-col ${plan.popular ? 'ring-2 ring-primary shadow-[0_0_40px_rgba(16,185,129,0.15)] bg-primary/[0.02]' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg whitespace-nowrap">
                                    Most Popular
                                </div>
                            )}
                            <div className="mb-8 md:mb-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/5 rounded-xl">{plan.icon}</div>
                                    <h3 className="text-2xl font-black text-white tracking-tight">{plan.name}</h3>
                                </div>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl md:text-5xl font-black text-white">{plan.price}</span>
                                    {plan.price !== "Custom" && <span className="text-slate-500 font-bold">/mo</span>}
                                </div>
                                <p className="text-slate-400 font-medium text-sm md:text-base leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="flex-grow space-y-4 md:space-y-5 mb-10">
                                {plan.features.map((feature, fIndex) => (
                                    <div key={fIndex} className="flex items-start gap-3">
                                        <div className="mt-1 p-0.5 bg-primary/20 rounded text-primary flex-shrink-0">
                                            <Check size={14} />
                                        </div>
                                        <span className="text-sm md:text-base font-semibold text-slate-300">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-95 cursor-pointer ${plan.popular ? 'bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/20' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
                                {plan.buttonText}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </main>
            <Footer />
        </>
    );
}
