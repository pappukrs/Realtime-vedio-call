import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Video, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: 'Product', href: '/product' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Enterprise', href: '/enterprise' },
    ];

    return (
        <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 md:py-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group relative z-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform"
                >
                    <Video className="text-white" size={22} />
                </motion.div>
                <span className="text-xl md:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    LiveCall
                </span>
            </Link>

            {/* Desktop Links */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:flex items-center gap-10 text-sm font-semibold"
            >
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "transition-colors hover:text-white",
                            pathname === link.href ? "text-white" : "text-slate-400"
                        )}
                    >
                        {link.name}
                    </Link>
                ))}
                <Link href="/login">
                    <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer text-slate-400 hover:text-white">
                        Log In
                    </button>
                </Link>
            </motion.div>

            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden relative z-50 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-[#0a0e1a]/95 backdrop-blur-xl md:hidden flex flex-col items-center justify-center gap-8 p-6"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "text-2xl font-black tracking-tighter transition-colors",
                                    pathname === link.href ? "text-primary" : "text-white/60 hover:text-white"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link href="/login" onClick={() => setIsOpen(false)} className="w-full max-w-xs">
                            <button className="w-full py-5 bg-primary text-white font-black text-xl rounded-2xl shadow-2xl shadow-primary/20 cursor-pointer">
                                Log In
                            </button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
