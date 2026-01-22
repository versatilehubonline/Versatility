"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, AlertCircle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricePoint {
    date: string;
    price: number;
}

interface PriceTrajectoryProps {
    data?: PricePoint[];
}

export function PriceTrajectory({ data = [] }: PriceTrajectoryProps) {
    if (!data || data.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                        <DollarSign className="h-3 w-3" /> Price Trajectory
                    </h4>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                    <AlertCircle className="h-8 w-8 text-white/20 mx-auto mb-3" />
                    <p className="text-[10px] font-black leading-relaxed text-white/40 uppercase tracking-tight">
                        Price data unavailable for this URL. Historical tracking requires continuous monitoring over time.
                    </p>
                </div>
            </div>
        );
    }

    // If only one data point (current price), show limited view
    if (data.length === 1) {
        const currentPrice = data[0].price;
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                            <DollarSign className="h-3 w-3" /> Current Price
                        </h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white">${currentPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-black leading-relaxed text-blue-200/60 uppercase tracking-tight">
                        Building price history... Check back later to see price trends. Historical data requires continuous monitoring.
                    </p>
                </div>
            </div>
        );
    }

    const prices = data.map(d => d.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const currentPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const diff = currentPrice - firstPrice;
    const percentChange = ((diff / firstPrice) * 100).toFixed(1);
    const isUp = diff > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                        <DollarSign className="h-3 w-3" /> Price Trajectory
                    </h4>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">${currentPrice}</span>
                        <div className={cn(
                            "flex items-center text-[10px] font-black px-2 py-0.5 rounded-full border",
                            isUp ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"
                        )}>
                            {isUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {Math.abs(Number(percentChange))}%
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">90-Day Range</p>
                    <p className="text-[10px] font-black text-white/60">${minPrice} — ${maxPrice}</p>
                </div>
            </div>

            <div className="relative h-32 flex items-end gap-1 px-2">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none">
                    <div className="border-t border-white w-full" />
                    <div className="border-t border-white w-full" />
                    <div className="border-t border-white w-full" />
                </div>

                {data.map((point, i) => {
                    const height = ((point.price - (minPrice * 0.9)) / (maxPrice - (minPrice * 0.9))) * 100;
                    return (
                        <div key={i} className="flex-1 group relative h-full flex items-end">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: 0.1 * i, duration: 0.8, ease: "easeOut" }}
                                className={cn(
                                    "w-full rounded-t-sm transition-all duration-300 relative",
                                    i === data.length - 1 ? (isUp ? "bg-red-500/40" : "bg-green-500/40") : "bg-white/10 group-hover:bg-white/20"
                                )}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    ${point.price}
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {isUp && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-black leading-relaxed text-red-200/60 uppercase tracking-tight">
                        Warning: Potential price inflation detected. Recent trends show a {percentChange}% increase over previous baseline.
                    </p>
                </div>
            )}
        </div>
    );
}
