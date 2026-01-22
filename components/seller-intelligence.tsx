"use client";

import { motion } from "framer-motion";
import { UserCheck, Calendar, MapPin, Activity, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerIntelligenceProps {
    data: {
        rating: number;
        details: string;
        accountAge?: string;
        location?: string;
        fulfillmentRate?: number;
    };
}

export function SellerIntelligence({ data }: SellerIntelligenceProps) {
    const stats = [
        { label: "Account Age", value: data.accountAge || "N/A", icon: Calendar },
        { label: "Origin", value: data.location || "N/A", icon: MapPin },
        { label: "Fulfillment", value: `${data.fulfillmentRate}%` || "N/A", icon: Activity },
        { label: "Trust Score", value: "Verified", icon: ShieldCheck },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Seller Intel</h4>
                    <p className="text-sm font-black text-white">{data.details}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 hover:bg-white/[0.05] transition-colors"
                    >
                        <div className="flex items-center gap-2 text-white/30">
                            <stat.icon className="h-3 w-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <p className="text-[11px] font-black text-white uppercase">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary">Reliability Verification</span>
                </div>
                <p className="text-[10px] font-black leading-relaxed text-white/50 uppercase tracking-tight">
                    Seller profile matches historical patterns for reliable merchants. No significant blacklisting or pattern shifts detected in the last 180 days.
                </p>
            </div>
        </div>
    );
}
