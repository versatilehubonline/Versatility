"use client";

import { useHistory, HistoryItem } from "@/lib/history";
import { useFavorites, FavoriteItem } from "@/lib/favorites";
import { Button } from "@/components/ui/button";
import { History, Trash2, Clock, ExternalLink, ShieldCheck, AlertTriangle, ShieldAlert, Heart, Bookmark, Bell, Check, X, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { useAuth } from "@clerk/nextjs";

export function HistorySidebar() {
    const { history, clearHistory } = useHistory();
    const { favorites } = useFavorites();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');
    const { isSignedIn } = useAuth();

    // Prevent hydration mismatch
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const items = activeTab === 'history' ? history : favorites;

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="fixed left-4 top-4 z-50 bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl hover:bg-white/10 transition-all rounded-xl"
                onClick={() => setIsOpen(true)}
            >
                <History className="h-5 w-5 text-white/70" />
            </Button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Panel */}
            <div className={cn(
                "fixed top-0 left-0 h-full w-80 bg-[#0A0A0A] border-r border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 transform transition-transform duration-500 ease-in-out p-8 flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 text-white/40">
                        {activeTab === 'history' ? <Clock className="h-4 w-4 text-primary" /> : <Heart className="h-4 w-4 text-red-400" />}
                        {activeTab === 'history' ? "Intelligence Logs" : "Saved Products"}
                    </h2>
                    <Button variant="ghost" size="icon" className="text-white/20 hover:text-white" onClick={() => setIsOpen(false)}>
                        <span className="sr-only">Close</span>
                        &times;
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-white/5 rounded-xl mb-6">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                            activeTab === 'history' ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white"
                        )}
                    >
                        History
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={cn(
                            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                            activeTab === 'saved' ? "bg-red-500/20 text-red-200 shadow-lg" : "text-white/40 hover:text-white"
                        )}
                    >
                        Saved
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {!isSignedIn ? (
                        <div className="flex flex-col items-center justify-center h-60 text-white/40 text-center px-6">
                            <Lock className="h-8 w-8 mb-4 opacity-50" />
                            <p className="text-xs uppercase font-black tracking-widest mb-2">Login Required</p>
                            <p className="text-[10px] leading-relaxed mb-4 opacity-70">
                                Sign in to sync your search history and saved alerts across devices.
                            </p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 text-white/20 text-[10px] font-black uppercase tracking-widest text-center">
                            {activeTab === 'history' ? <Clock className="h-10 w-10 mb-4 opacity-10" /> : <Bookmark className="h-10 w-10 mb-4 opacity-10" />}
                            <p>{activeTab === 'history' ? "No records found in current nexus." : "No saved products yet."}</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.url + item.timestamp} className="group relative">
                                <Link
                                    href={`/analyze?url=${encodeURIComponent(item.url)}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block"
                                >
                                    <div className="border border-white/5 rounded-2xl p-4 hover:bg-white/[0.03] transition-all bg-white/[0.01] relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest",
                                                // @ts-ignore
                                                item.risk === 'Safe' || item.verdict === 'LEGIT' || item.verdict === 'SECURE' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                    // @ts-ignore
                                                    item.risk === 'Moderate' || item.verdict === 'CAUTION' ? "bg-yellow-500/10 text-yellow-400 border-yellow-200/20" :
                                                        "bg-red-500/10 text-red-400 border-red-500/20"
                                            )}>
                                                {/* @ts-ignore */}
                                                {(item.risk === 'Safe' || item.verdict === 'LEGIT' || item.verdict === 'SECURE') ? <ShieldCheck className="h-2 w-2" /> : <AlertTriangle className="h-2 w-2" />}
                                                {/* @ts-ignore */}
                                                {item.risk || item.verdict || 'UNKNOWN'}
                                            </div>
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-[11px] font-black line-clamp-2 leading-tight text-white/70 group-hover:text-primary transition-colors uppercase tracking-tight">
                                            {item.title}
                                        </h3>

                                        {/* Price & Target UI */}
                                        {activeTab === 'saved' && (
                                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-xs font-black text-white">{/* @ts-ignore */ item.price || 'N/A'}</span>
                                                {/* @ts-ignore */}
                                                {item.targetPrice ? (
                                                    <div className="flex items-center gap-1 text-[9px] text-green-400 font-bold">
                                                        <Bell className="w-3 h-3 fill-current" /> {('targetPrice' in item) ? item.targetPrice : null}
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] text-white/20">Set Alert</span>
                                                )}
                                            </div>
                                        )}

                                        <p className="text-[9px] text-white/20 font-black mt-2 truncate uppercase tracking-widest">
                                            {item.url.replace(/^https?:\/\/(www\.)?/, '')}
                                        </p>
                                    </div>
                                </Link>

                                {activeTab === 'saved' && (
                                    <div className="mt-2 px-2" onClick={(e) => e.stopPropagation()}>
                                        <TargetPriceInput item={item as FavoriteItem} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {activeTab === 'history' && history.length > 0 && (
                    <div className="pt-6 mt-6 border-t border-white/5">
                        <Button
                            variant="outline"
                            className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] text-red-400/60 hover:text-red-400 hover:bg-red-400/5 border-white/5"
                            onClick={clearHistory}
                        >
                            <Trash2 className="h-3 w-3 mr-2" /> Purge Logs
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

function TargetPriceInput({ item }: { item: FavoriteItem }) {
    const { toggleFavorite } = useFavorites();
    const [price, setPrice] = useState("");
    const [show, setShow] = useState(false);

    const handleSave = () => {
        if (!price || isNaN(parseFloat(price))) return;
        toggleFavorite({
            ...item,
            // @ts-ignore
            targetPrice: parseFloat(price)
        });
        setShow(false);
    };

    if (!show) {
        return (
            <button onClick={() => setShow(true)} className="w-full text-center py-2 text-[9px] uppercase font-bold text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                {/* @ts-ignore */}
                {item.targetPrice ? "Update Alert Price" : "Set Price Alert"}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
            <span className="text-[10px] text-white/50 pl-2">$</span>
            <input
                autoFocus
                className="bg-transparent border-none outline-none text-white text-xs font-bold w-full"
                placeholder="Target..."
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-400 hover:text-green-300 hover:bg-green-400/10" onClick={handleSave}>
                <Check className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-white/20 hover:text-white" onClick={() => setShow(false)}>
                <X className="w-3 h-3" />
            </Button>
        </div>
    )
}
