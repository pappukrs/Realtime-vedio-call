"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { ShieldCheck, Server, Lock, BarChart, Settings, Mail } from 'lucide-react';

const enterpriseFeatures = [
    {
        icon: <ShieldCheck className="text-blue-400" size={32} />,
        title: "Military-Grade Security",
        description: "Compliant with SOC2, GDPR, and HIPAA. We use FIPS-validated encryption modules."
    },
    {
        icon: <Server className="text-blue-400" size={32} />,
        title: "On-Premise Deployment",
        description: "Full control over your data with air-gapped or VPC hosting options."
    },
    {
        icon: <Lock className="text-blue-400" size={32} />,
        title: "Advanced SSO & IAM",
        description: "Seamlessly integrate with Okta, Azure AD, and SAML-based providers."
    },
    {
        icon: <BarChart className="text-blue-400" size={32} />,
        title: "Admin Analytics & ROI",
        description: "Deep insights into organizational usage, attendance, and call quality metrics."
    }
];

export default function EnterprisePage() {
    return (
        <>
            <Navbar />
            <main className="relative z-10 flex-grow w-full max-w-7xl mx-auto px-6 py-12 md:py-24">
                <div className="flex flex-col lg:flex-row gap-16 md:gap-20 items-center">
                    <div className="flex-1 space-y-10 md:space-y-12 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6 md:space-y-8"
                        >
                            <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest w-fit rounded-full mx-auto lg:mx-0">
                                For Organizations
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                                Enterprise <span className="text-blue-500">Excellence.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto lg:mx-0">
                                Scaling your communications shouldn't be a challenge. LiveCall Enterprise
                                provides the security, controls, and support your teams need to excel.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10 text-left">
                            {enterpriseFeatures.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="space-y-4"
                                >
                                    <div className="p-3 bg-white/5 rounded-2xl w-fit">{feature.icon}</div>
                                    <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                                    <p className="text-slate-500 text-sm md:text-base leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg glass p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border-white/5 shadow-2xl"
                    >
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Request a Demo</h2>
                        <p className="text-slate-400 mb-8 font-medium text-sm md:text-base">Connect with our enterprise experts to build a custom solution for your team.</p>

                        <form className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Business Email</label>
                                <input type="email" placeholder="name@company.com" className="w-full px-6 py-4 md:py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white font-medium shadow-inner transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Company Size</label>
                                <div className="relative">
                                    <select className="w-full px-6 py-4 md:py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white font-medium appearance-none cursor-pointer">
                                        <option>100-500 employees</option>
                                        <option>501-2000 employees</option>
                                        <option>2000+ employees</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <Settings size={16} />
                                    </div>
                                </div>
                            </div>
                            <button className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-2xl transition-all active:scale-95 shadow-2xl shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-3">
                                <Mail size={20} />
                                Contact Sales
                            </button>
                        </form>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    );
}
