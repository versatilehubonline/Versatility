
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link as LinkIcon, ExternalLink, ShieldCheck, Tag, TrendingUp, Sparkles, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Deal {
    id: string;
    url: string;
    title: string;
    image: string | null;
    score: number;
    verdict: string;
    price: number | null;
    timestamp: string;
}

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/deals')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setDeals(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-6 md:px-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none appearance-none select-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full filter blur-[128px]" />
                <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,transparent,black,transparent)]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-black tracking-widest mb-4"
                    >
                        <Sparkles className="w-3 h-3" /> Community Verified
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black tracking-tighter text-white"
                    >
                        Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Deals</span> Feed
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/40 max-w-2xl mx-auto font-medium text-lg"
                    >
                        Real-time feed of products verified safe by the community. High trust scores, active monitoring.
                    </motion.p>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Skeleton key={i} className="h-[320px] rounded-3xl bg-white/5" />
                        ))}
                    </div>
                ) : deals.length === 0 ? (
                    <div className="text-center py-20 border border-white/5 rounded-[40px] bg-white/[0.02]">
                        <ShoppingBag className="w-16 h-16 mx-auto text-white/10 mb-6" />
                        <h3 className="text-xl font-bold text-white/50 mb-2">No verified deals yet</h3>
                        <p className="text-white/30 text-sm mb-6">Start analyzing products to populate the feed.</p>
                        <Link href="/">
                            <Button className="rounded-full">Analyze Product</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {deals.map((deal, i) => (
                            <motion.div
                                key={deal.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link href={`/analyze?url=${encodeURIComponent(deal.url)}`} className="group block h-full">
                                    <Card className="h-full bg-white/[0.03] border-white/5 backdrop-blur-md rounded-[24px] overflow-hidden hover:bg-white/[0.06] transition-all group-hover:-translate-y-1 duration-500 shadow-xl group-hover:shadow-primary/5">
                                        <div className="aspect-[4/3] bg-black/20 relative overflow-hidden flex items-center justify-center p-6">
                                            {deal.image ? (
                                                <img src={deal.image} alt={deal.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                                            ) : (
                                                <ShoppingBag className="w-12 h-12 text-white/10" />
                                            )}

                                            <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                                                <Badge className={cn(
                                                    "border-0 uppercase font-black text-[9px] tracking-widest px-2 py-1 shadow-lg",
                                                    deal.score >= 80 ? "bg-green-500 text-black" : "bg-yellow-500 text-black"
                                                )}>
                                                    {deal.score} • {deal.verdict}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardContent className="p-5">
                                            <h3 className="font-bold text-sm leading-tight text-white/90 line-clamp-2 mb-3 group-hover:text-primary transition-colors h-10">
                                                {deal.title}
                                            </h3>

                                            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-0.5">Price</span>
                                                    <span className="text-lg font-black text-white">
                                                        {deal.price ? `$${deal.price.toLocaleString()}` : <span className="text-white/20 text-xs">Unknown</span>}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-0.5">Verified</span>
                                                    <span className="text-[10px] font-bold text-white/60">
                                                        {new Date(deal.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
