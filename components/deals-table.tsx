"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    ShoppingBag,
    ExternalLink,
    ShieldCheck,
    AlertTriangle,
    Tag,
    CheckCircle2,
    Package,
    ArrowRight,
    Heart,
    Trophy,
    Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites";
import { useRouter } from "next/navigation";

interface DealItem {
    title: string;
    url: string;
    score: number;
    verdict?: string;
    image?: string;
    price?: string;
    source: string;
    shipping?: string;
    condition?: string;
}

interface DealsTableProps {
    items: DealItem[];
    query?: string | null;
}

const OFFICIAL_STORES = [
    "amazon", "target", "walmart", "bestbuy",
    "apple", "nike", "adidas", "microsoft",
    "samsung", "official"
];

const parsePrice = (priceStr?: string) => {
    if (!priceStr) return Infinity;
    const match = priceStr.match(/[\d,]+\.?\d*/);
    if (!match) return Infinity;
    return parseFloat(match[0].replace(/,/g, ''));
};

function DealRow({ item, bestPrice, query }: { item: DealItem, bestPrice: number, query?: string | null }) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const router = useRouter();

    const priceVal = parsePrice(item.price);
    const isBestPrice = priceVal !== Infinity && priceVal <= bestPrice;

    // Calculate a "Deal Score" (0-10) based on Trust (score) and Price
    // This is purely heuristic for visual flair
    const dealScore = Math.min(10, Math.max(0,
        (item.score / 10) - (priceVal > bestPrice * 1.2 ? 2 : 0)
    )).toFixed(1);

    const isSecure = item.verdict === 'LEGIT' || item.verdict === 'SECURE' || item.score >= 80;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group grid grid-cols-[1.5fr_2fr_1fr_1fr_0.8fr_1fr] gap-4 p-4 items-center bg-white/[0.02] border-b border-white/5 hover:bg-white/[0.04] transition-colors first:rounded-t-xl last:rounded-b-xl last:border-0"
        >
            {/* Store */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-white/10 group-hover:text-white transition-colors">
                    {OFFICIAL_STORES.some(s => item.source.toLowerCase().includes(s)) ? (
                        <Store className="w-4 h-4" />
                    ) : (
                        <ShoppingBag className="w-4 h-4" />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-white capitalize">{item.source}</span>
                    <span className="text-[9px] text-white/30 uppercase tracking-wider font-medium">
                        {item.condition || "Market"}
                    </span>
                </div>
            </div>

            {/* Product Title */}
            <div className="flex items-center gap-3 overflow-hidden">
                {item.image && (
                    <div className="w-8 h-8 rounded bg-white p-0.5 shrink-0">
                        <img src={item.image} className="w-full h-full object-contain" alt="" />
                    </div>
                )}
                <span className="text-xs text-white/70 font-medium truncate" title={item.title}>
                    {item.title}
                </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
                <span className={cn(
                    "text-sm font-black",
                    isBestPrice ? "text-green-400" : "text-white"
                )}>
                    {item.price || "N/A"}
                </span>
                {isBestPrice && (
                    <Badge variant="outline" className="h-5 px-1.5 bg-green-500/10 text-green-400 border-green-500/20 text-[8px] uppercase tracking-widest font-black gap-1">
                        <Tag className="w-2 h-2" /> Best
                    </Badge>
                )}
            </div>

            {/* Shipping / Cut */}
            <div className="text-xs text-white/50 font-medium flex items-center gap-2">
                {item.shipping ? (
                    <>
                        <Package className="w-3 h-3 text-white/20" /> {item.shipping}
                    </>
                ) : (
                    <span className="opacity-30">-</span>
                )}
            </div>

            {/* Score / Trust */}
            <div className="flex items-center gap-2">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ring-1 ring-inset",
                    isSecure ? "bg-green-500/10 text-green-400 ring-green-500/20" : "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20"
                )}>
                    {dealScore}
                </div>
                <div className="flex flex-col">
                    <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider",
                        isSecure ? "text-green-400" : "text-yellow-400"
                    )}>
                        {item.verdict || (item.score >= 80 ? "Good" : "Fair")}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                        "h-8 w-8 p-0 rounded-lg hover:bg-white/10",
                        isFavorite(item.url) ? "text-red-400 bg-red-400/5" : "text-white/20 hover:text-white"
                    )}
                    onClick={() => toggleFavorite({
                        url: item.url,
                        title: item.title,
                        price: item.price || null,
                        image: item.image || null,
                        score: item.score || 85,
                        verdict: item.verdict || "UNKNOWN"
                    })}
                >
                    <Heart className={cn("h-4 w-4", isFavorite(item.url) && "fill-current")} />
                </Button>
                <Button
                    size="sm"
                    className="h-8 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-wider border border-white/5"
                    onClick={() => {
                        if (query) {
                            router.push(`/analyze?url=${encodeURIComponent(item.url)}`);
                        } else {
                            window.open(item.url, '_blank');
                        }
                    }}
                >
                    View <ExternalLink className="ml-2 w-3 h-3 opacity-50" />
                </Button>
            </div>
        </motion.div>
    );
}

export function DealsTable({ items, query }: DealsTableProps) {
    // 1. Split items
    const officialStores = items.filter(i =>
        OFFICIAL_STORES.some(store => i.source.toLowerCase().includes(store))
    );
    const marketplaces = items.filter(i =>
        !OFFICIAL_STORES.some(store => i.source.toLowerCase().includes(store))
    );

    // 2. Sort by Price (Ascending)
    const sortByPrice = (a: DealItem, b: DealItem) => parsePrice(a.price) - parsePrice(b.price);
    officialStores.sort(sortByPrice);
    marketplaces.sort(sortByPrice);

    // 3. Find global best price for highlighting
    const allPrices = items.map(i => parsePrice(i.price)).filter(p => p !== Infinity);
    const bestPrice = Math.min(...allPrices);

    return (
        <div className="space-y-12">
            {/* Official Stores Section */}
            {officialStores.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> Verified Retailers
                        </h3>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">
                            Recommended Source
                        </Badge>
                    </div>
                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0A0A0A]">
                        <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_0.8fr_1fr] gap-4 p-4 border-b border-white/10 bg-white/[0.02] text-[9px] font-black uppercase tracking-widest text-white/30 select-none">
                            <div>Store</div>
                            <div>Product</div>
                            <div>Price</div>
                            <div>Delivery</div>
                            <div>Deal Rating</div>
                            <div className="text-right">Action</div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {officialStores.map((item, idx) => (
                                <DealRow key={idx} item={item} bestPrice={bestPrice} query={query} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Marketplaces Section */}
            {marketplaces.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-blue-400" /> Marketplaces & Keyshops
                        </h3>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] font-black uppercase tracking-wider">
                            Checking Required
                        </Badge>
                    </div>
                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0A0A0A]">
                        <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_0.8fr_1fr] gap-4 p-4 border-b border-white/10 bg-white/[0.02] text-[9px] font-black uppercase tracking-widest text-white/30 select-none">
                            <div>Marketplace</div>
                            <div>Product</div>
                            <div>Price</div>
                            <div>Status</div>
                            <div>Deal Rating</div>
                            <div className="text-right">Action</div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {marketplaces.map((item, idx) => (
                                <DealRow key={idx} item={item} bestPrice={bestPrice} query={query} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
