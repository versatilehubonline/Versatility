"use client";

import { motion } from "framer-motion";
import { Zap, Shield, BarChart3, ChevronRight, Laptop, HeartPulse, Sparkles, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STEPS = [
    {
        title: "Initialize Scan",
        desc: "Paste any product or store URL. Our AI starts deep-packet inspection immediately.",
        icon: Zap,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
    },
    {
        title: "Verify Identity",
        desc: "Cross-referencing with CPSC, FDA, and global seller blacklists in real-time.",
        icon: Shield,
        color: "text-primary",
        bg: "bg-primary/10"
    },
    {
        title: "Execute Verdict",
        desc: "Receive a cinematic reliability report with price history and seller intelligence.",
        icon: BarChart3,
        color: "text-purple-400",
        bg: "bg-purple-400/10"
    }
];

const CATEGORIES = [
    { name: "Electronics", icon: Laptop, count: "Demo Category" },
    { name: "Health & Beauty", icon: HeartPulse, count: "Demo Category" },
    { name: "Marketplaces", icon: Building2, count: "Demo Category" }
];

export function LandingFeatures() {
    return (
        <section className="w-full max-w-7xl px-6 py-32 space-y-40">
            {/* Global Stats - DEMO DATA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-y border-white/5 py-12">
                {[
                    { label: "Demo: Scans Performed", value: "54,201", prefix: "+" },
                    { label: "Demo: Sample Trust Index", value: "84.2", suffix: "%" },
                    { label: "Demo: Test Monitors", value: "1.2M", prefix: "" }
                ].map((stat, i) => (
                    <div key={i} className="text-center md:text-left space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">{stat.label}</p>
                        <p className="text-4xl font-black text-white font-display">
                            <span className="text-primary">{stat.prefix}</span>
                            {stat.value}
                            <span className="text-white/20">{stat.suffix}</span>
                        </p>
                    </div>
                ))}
            </div>

            {/* How it Works */}
            <div className="space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-primary">Intelligence Protocol</h2>
                    <h3 className="text-4xl md:text-5xl font-black text-white font-display tracking-tighter">Beyond Simple Checks.</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {STEPS.map((step, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 space-y-6 group transition-all duration-500"
                        >
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110", step.bg)}>
                                <step.icon className={cn("h-7 w-7", step.color)} />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">{step.title}</h4>
                                <p className="text-xs font-bold text-white/40 leading-relaxed uppercase tracking-tight">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Categories & CTA */}
            <div className="relative rounded-[48px] overflow-hidden border border-white/5 bg-white/[0.02] p-12 md:p-20">
                <div className="absolute top-0 right-0 p-12 opacity-10 blur-xl">
                    <Sparkles className="h-64 w-64 text-primary" />
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-3xl md:text-4xl font-black text-white uppercase font-display leading-[1.1]">
                                Verified Intelligence <br /> for Every Vertical.
                            </h3>
                            <p className="text-sm font-bold text-white/40 uppercase tracking-tight max-w-md">
                                Don't let your data be the product. Analyze vendors across any vertical before committing to a purchase.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {CATEGORIES.map((cat, i) => (
                                <div key={i} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                                    <cat.icon className="h-4 w-4 text-primary" />
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase">{cat.name}</p>
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{cat.count}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-[32px] p-10 space-y-6">
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Protect Your Capital.</h4>
                        <p className="text-xs font-bold text-white/60 leading-relaxed uppercase tracking-tight">
                            Every scan helps improve our global reliability mesh. Stop scams at their source and shop with absolute certainty.
                        </p>
                        <Button className="w-full h-14 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary hover:text-white transition-all duration-700">
                            Create Free Account <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
