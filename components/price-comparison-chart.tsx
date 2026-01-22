"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceComparisonChartProps {
    currentPrice: number;
    marketAverage: number;
    productName?: string;
}

export function PriceComparisonChart({ currentPrice, marketAverage, productName = "This Item" }: PriceComparisonChartProps) {
    if (!currentPrice || !marketAverage) return null;

    const diff = currentPrice - marketAverage;
    const isGoodDeal = diff <= 0;
    const percentDiff = Math.abs((diff / marketAverage) * 100).toFixed(1);

    // Calculate bar heights (max 100%)
    const maxVal = Math.max(currentPrice, marketAverage);
    const currentHeight = (currentPrice / maxVal) * 100;
    const averageHeight = (marketAverage / maxVal) * 100;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                        <DollarSign className="h-3 w-3" /> Market Intelligence
                    </h4>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className={cn(
                            "text-2xl font-black",
                            isGoodDeal ? "text-green-400" : "text-red-400"
                        )}>
                            {isGoodDeal ? "Good Deal" : "Price Premium"}
                        </span>
                        <div className={cn(
                            "flex items-center text-[10px] font-black px-2 py-0.5 rounded-full border",
                            isGoodDeal ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                            {isGoodDeal ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                            {percentDiff}% {isGoodDeal ? "Below" : "Above"} Avg
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative h-32 flex items-end gap-8 px-4 border-b border-white/5 pb-0">
                {/* Current Item Bar */}
                <div className="flex-1 flex flex-col justify-end group">
                    <div className="text-[10px] font-black text-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        ${currentPrice.toFixed(2)}
                    </div>
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${currentHeight}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                            "w-full rounded-t-xl transition-all duration-300 relative min-h-[4px]",
                            isGoodDeal ? "bg-green-500" : "bg-red-500"
                        )}
                    >
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-black/50 uppercase tracking-widest">You</div>
                    </motion.div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-center mt-3 text-white/60 truncate px-1">
                        {productName}
                    </p>
                </div>

                {/* Market Average Bar */}
                <div className="flex-1 flex flex-col justify-end group">
                    <div className="text-[10px] font-black text-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        ${marketAverage.toFixed(2)}
                    </div>
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${averageHeight}%` }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        className="w-full bg-white/10 rounded-t-xl relative min-h-[4px]"
                    >
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/30 uppercase tracking-widest">Avg</div>
                    </motion.div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-center mt-3 text-white/40">
                        Market Average
                    </p>
                </div>
            </div>

            <div className={cn(
                "p-4 rounded-2xl border flex items-start gap-3",
                isGoodDeal ? "bg-green-500/5 border-green-500/10" : "bg-red-500/5 border-red-500/10"
            )}>
                {isGoodDeal ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                <p className={cn(
                    "text-[10px] font-black leading-relaxed uppercase tracking-tight",
                    isGoodDeal ? "text-green-200/60" : "text-red-200/60"
                )}>
                    {isGoodDeal
                        ? "This product is priced competitively compared to similar listings found on Amazon, eBay, and other tracked markets."
                        : "Caution: This price is higher than the calculated market average. Consider checking the 'Trusted Alternatives' below for better value."}
                </p>
            </div>
        </div>
    );
}
