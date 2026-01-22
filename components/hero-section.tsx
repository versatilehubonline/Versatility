"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, ShoppingBag, ShieldCheck, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FADE_UP_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

export function HeroSection() {
    const [input, setInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'verify' | 'search'>('search');
    const router = useRouter();

    const handleAction = () => {
        setError(null);
        if (!input.trim()) {
            setError(mode === 'verify' ? "Please enter a valid URL." : "Please enter a product name.");
            return;
        }

        if (mode === 'verify') {
            // Validation for Verify Mode
            if (!input.includes(".") || input.includes(" ")) {
                setError("Invalid URL format. Please paste a full link.");
                return;
            }
            try {
                const urlToTest = input.startsWith('http') ? input : `https://${input}`;
                new URL(urlToTest);
                router.push(`/analyze?url=${encodeURIComponent(urlToTest)}`);
            } catch (_) {
                setError("Invalid URL format.");
            }
        } else {
            // Search Mode
            router.push(`/analyze?query=${encodeURIComponent(input)}`);
        }
    };

    return (
        <div className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-[#050505] selection:bg-primary/30">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full mix-blend-screen filter blur-[128px] animate-pulse duration-1000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
            </div>

            <main className="relative z-10 w-full max-w-7xl px-6 flex flex-col items-center">
                <motion.div
                    initial="hidden"
                    animate="show"
                    viewport={{ once: true }}
                    variants={{
                        hidden: {},
                        show: {
                            transition: {
                                staggerChildren: 0.15,
                            },
                        },
                    }}
                    className="text-center space-y-10"
                >
                    {/* Badge */}
                    <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="flex justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary fill-primary/20" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">100% PRE-VERIFIED PRODUCTS</span>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="space-y-6">
                        <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white font-display leading-[0.85] uppercase">
                            Shop The <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">Immaculate.</span>
                        </h1>
                        <p className="text-base md:text-xl text-muted-foreground font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
                            We've done the research so you don't have to. <br className="hidden md:block" />
                            Paste a link to verify or search our verified catalog.
                        </p>
                    </motion.div>

                    {/* Input Mode Tabs */}
                    <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="flex justify-center mb-6">
                        <div className="flex p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
                            <button
                                onClick={() => { setMode('search'); setInput(""); setError(null); }}
                                className={cn(
                                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                    mode === 'search' ? "bg-primary text-black shadow-lg shadow-primary/20" : "bg-transparent text-white/40 hover:text-white"
                                )}
                            >
                                Find Products
                            </button>
                            <button
                                onClick={() => { setMode('verify'); setInput(""); setError(null); }}
                                className={cn(
                                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                    mode === 'verify' ? "bg-white text-black shadow-lg" : "bg-transparent text-white/40 hover:text-white"
                                )}
                            >
                                Verify Link
                            </button>
                        </div>
                    </motion.div>

                    {/* Search Input */}
                    <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="w-full max-w-xl mx-auto relative group z-20">
                        <div className={cn("absolute -inset-1 rounded-full blur opacity-20 group-hover:opacity-60 transition duration-1000", mode === 'search' ? "bg-gradient-to-r from-primary/20 to-purple-500/20" : "bg-gradient-to-r from-white/20 to-gray-500/20")} />
                        <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-2 pr-2 shadow-2xl">
                            {mode === 'search' ? <Search className="ml-4 w-5 h-5 text-white/30" /> : <ShieldCheck className="ml-4 w-5 h-5 text-white/30" />}
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => { setInput(e.target.value); setError(null); }}
                                onKeyDown={(e) => e.key === "Enter" && handleAction()}
                                placeholder={mode === 'verify' ? "Paste any product link (Amazon, eBay, TikTok...)" : "Search keyword (e.g. 'Sony Headphones')"}
                                className="flex-1 bg-transparent border-none text-white placeholder:text-white/20 focus:outline-none focus:ring-0 px-4 h-10 text-sm font-medium"
                            />
                            <Button
                                onClick={handleAction}
                                size="sm"
                                className={cn("rounded-full h-10 px-6 font-bold uppercase tracking-wider text-xs transition-colors", mode === 'search' ? "bg-primary text-black hover:bg-primary/90" : "bg-white text-black hover:bg-white/90")}
                            >
                                {mode === 'verify' ? "Analyze" : "Search"}
                            </Button>
                        </div>
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute -bottom-8 left-0 right-0 text-center text-[10px] text-red-400 font-bold uppercase tracking-wider"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Buttons */}
                    <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 opacity-60 hover:opacity-100 transition-opacity">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="text-white/40 hover:text-white uppercase tracking-widest text-xs font-bold"
                        >
                            <Link href="#products">
                                View Collection <ArrowRight className="ml-2 h-3 w-3" />
                            </Link>
                        </Button>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        variants={FADE_UP_ANIMATION_VARIANTS}
                        className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto opacity-70"
                    >
                        {[
                            { label: "Scam Free", icon: ShieldCheck },
                            { label: "Verified Sellers", icon: Sparkles },
                            { label: "Consumer Safe", icon: Zap },
                            { label: "Best Price", icon: ShoppingBag },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center justify-center gap-2 p-4">
                                <item.icon className="w-5 h-5 text-white/40" />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
}

