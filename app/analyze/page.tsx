"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { analyzeProduct, AnalysisResult } from "@/lib/analyzer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Star, Lock, Search, FileText, UserCheck, Truck, Zap, TrendingDown, TrendingUp, Sparkles, Command, ArrowRight, ShoppingBag, Heart, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProductPreview } from "@/components/product-preview";
import { useUserTier } from "@/lib/user-tier-context";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useHistory } from "@/lib/history";
import { ProductChat } from "@/components/product-chat";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceTrajectory } from "@/components/price-trajectory";
import { SellerIntelligence } from "@/components/seller-intelligence";
import { Badge } from "@/components/ui/badge";
import { PriceComparisonChart } from "@/components/price-comparison-chart";
import { useFavorites } from "@/lib/favorites";
import { DealsTable } from "@/components/deals-table";

function AnalyzeContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get("url");
    const query = searchParams.get("query");

    // Determine effective URL to analyze
    const effectiveUrl = url || (query ? `https://www.amazon.com/s?k=${encodeURIComponent(query)}` : null);

    const router = useRouter();
    const { isPro, upgradeToPro } = useUserTier();
    const { addToHistory } = useHistory();
    const { isFavorite, toggleFavorite } = useFavorites();

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [mounted, setMounted] = useState(false);

    const mode = (searchParams.get("mode") as 'product' | 'website') || 'product';

    useEffect(() => {
        setMounted(true);
        if (!effectiveUrl) {
            router.push("/");
            return;
        }

        analyzeProduct(effectiveUrl, mode, query || undefined).then((data) => {
            setResult(data);
            setLoading(false);
            addToHistory({
                url: effectiveUrl,
                title: `${mode === 'website' ? '[Site]' : '[Product]'} ${data.title || "Analysis"}`,
                score: data.score,
                risk: data.riskLevel,
                price: data.price,
                image: data.image
            });
        });
    }, [effectiveUrl, router, mode, query]);

    // Price Analysis Helpers
    const parsePrice = (priceStr: string | null | undefined): number | null => {
        if (!priceStr) return null;
        const match = priceStr.match(/[\d,]+\.?\d*/);
        if (!match) return null;
        return parseFloat(match[0].replace(/,/g, ''));
    };

    const currentPriceVal = result ? parsePrice(result.price) : null;

    // Calculate market average
    const marketPrices = result?.similarItems
        ? result.similarItems.map(i => parsePrice(i.price)).filter((p): p is number => p !== null && p > 0)
        : [];

    const marketAverage = marketPrices.length > 0
        ? marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length
        : null;

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-1000">
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>

                <Skeleton className="h-[200px] w-full rounded-[40px]" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <Skeleton className="h-[420px] w-full rounded-[32px]" />
                        <Skeleton className="h-[180px] w-full rounded-2xl" />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-[140px] w-full rounded-2xl" />
                            <Skeleton className="h-[140px] w-full rounded-2xl" />
                        </div>
                        <Skeleton className="h-[320px] w-full rounded-[32px]" />
                        <Skeleton className="h-[450px] w-full rounded-[32px]" />
                    </div>
                </div>

                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-full flex items-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 text-white">Synthesizing Safety Data...</span>
                </div>
            </div>
        );
    }

    if (!result || !effectiveUrl) return null;

    const currentScore = result.score ?? 0;
    const verdict = result.verdict || 'NEUTRAL';
    const scoreColor = (verdict === 'LEGIT' || verdict === 'SECURE') ? "text-green-500" : (verdict === 'NEUTRAL' || verdict === 'CAUTION') ? "text-yellow-500" : "text-red-500";
    const scoreGlow = (verdict === 'LEGIT' || verdict === 'SECURE') ? "shadow-green-500/10" : (verdict === 'NEUTRAL' || verdict === 'CAUTION') ? "shadow-yellow-500/10" : "shadow-red-500/10";
    const bgVerdict = scoreColor.replace('text-', 'bg-');

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center">
                <Button
                    variant="ghost"
                    className="group mb-4 px-6 py-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest border border-white/5"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-3 w-3 group-hover:-translate-x-1 transition-transform" /> Back to Intelligence
                </Button>

                <div className="flex items-center gap-2 mb-4">
                    <Button
                        variant="ghost"
                        className={cn(
                            "px-4 py-2 rounded-xl border transition-all font-black uppercase text-[10px] tracking-widest gap-2",
                            isFavorite(effectiveUrl)
                                ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/5"
                        )}
                        onClick={() => toggleFavorite({
                            url: effectiveUrl,
                            title: result.title || "Unknown Product",
                            price: result.price || null,
                            image: result.image || null,
                            score: result.score,
                            verdict: result.verdict
                        })}
                    >
                        <Heart className={cn("h-4 w-4", isFavorite(effectiveUrl) && "fill-current")} />
                        {isFavorite(effectiveUrl) ? "Saved" : "Save"}
                    </Button>

                    {!query && (
                        <Button
                            variant="outline"
                            className="hidden sm:flex px-6 py-2 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/10 text-white/60 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest gap-2"
                            onClick={() => window.print()}
                        >
                            <Download className="h-3 w-3" /> Export Report
                        </Button>
                    )}
                </div>
            </motion.div>

            {!query && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <ProductPreview url={effectiveUrl} />
                </motion.div>
            )}

            {!query && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Main Verdict */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-1 space-y-8"
                    >
                        <Card className={cn(
                            "h-fit border-none bg-white/[0.03] backdrop-blur-3xl rounded-[40px] shadow-2xl overflow-hidden transition-all duration-1000 relative group",
                            scoreGlow
                        )}>
                            <div className={cn("absolute inset-x-0 top-0 h-1", bgVerdict)} />
                            <CardHeader className="text-center pb-2 pt-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mx-auto mb-4">
                                    <Sparkles className="h-2 w-2 text-primary" />
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">
                                        {mode === 'website' ? "Final Trust Analysis" : "Reliability Verdict"}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center pt-2 pb-12 px-6 text-center">
                                <div className="relative flex items-center justify-center">
                                    <div className={cn("absolute inset-0 blur-[60px] opacity-20 transition-all duration-1000", bgVerdict)} />
                                    <svg className="w-56 h-56 transform -rotate-90 drop-shadow-2xl">
                                        <circle className="text-white/[0.03]" strokeWidth="6" stroke="currentColor" fill="transparent" r="95" cx="112" cy="112" />
                                        <motion.circle
                                            initial={{ strokeDashoffset: 597 }}
                                            animate={{ strokeDashoffset: 597 - (597 * currentScore) / 100 }}
                                            transition={{ duration: 2, ease: "circOut" }}
                                            className={cn(scoreColor)}
                                            strokeWidth="6"
                                            strokeDasharray={597}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="95"
                                            cx="112"
                                            cy="112"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                        <span className={cn("text-4xl font-black font-display tracking-tight group-hover:scale-110 transition-transform duration-700 leading-none", scoreColor)}>
                                            {verdict}
                                        </span>
                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mt-2">Safety Rating</span>
                                    </div>
                                </div>

                                <div className={cn(
                                    "mt-10 px-8 py-2 rounded-2xl text-[10px] font-black border uppercase tracking-[0.3em] transition-all duration-700 shadow-lg",
                                    (verdict === 'LEGIT' || verdict === 'SECURE') ? "bg-green-500 text-black border-transparent" :
                                        (verdict === 'NEUTRAL' || verdict === 'CAUTION') ? "bg-yellow-500 text-black border-transparent" :
                                            "bg-red-500 text-white border-transparent"
                                )}>
                                    {result.riskLevel}
                                </div>

                                <p className="mt-10 text-center text-[11px] font-black leading-relaxed max-w-[220px] text-white/60 uppercase tracking-tight">
                                    {result.summary}
                                </p>

                                <div className="mt-8 pt-8 border-t border-white/5 w-full space-y-4">
                                    <h4 className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 text-center">Intelligence Reasoning</h4>
                                    <div className="space-y-2">
                                        {result.scoreFactors.slice(0, 3).map((factor, i) => (
                                            <div key={i} className="flex items-center gap-3 text-[9px] font-black uppercase text-white/40">
                                                <div className={cn("w-1 h-1 rounded-full", factor.type === 'bonus' ? "bg-green-500" : "bg-red-500")} />
                                                <span>{factor.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Score Impact Breakdown */}
                        <Card className="bg-white/[0.03] border-white/5 rounded-[32px] overflow-hidden shadow-xl backdrop-blur-xl">
                            <CardHeader className="pb-4 pt-8">
                                <CardTitle className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-2">
                                    <Zap className="h-3 w-3 text-primary fill-primary" /> Key Influence Factors
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pb-8">
                                {result.scoreFactors && result.scoreFactors.length > 0 ? (
                                    result.scoreFactors.map((factor, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + (i * 0.1) }}
                                            className="flex items-center justify-between text-[11px] font-black"
                                        >
                                            <span className="text-white/50 uppercase tracking-tight">{factor.label}</span>
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border",
                                                factor.type === 'bonus' ? "text-green-400 bg-green-400/5 border-green-400/20" : "text-red-400 bg-red-400/5 border-red-400/20"
                                            )}>
                                                {factor.type === 'bonus' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <p className="text-[10px] italic opacity-50 uppercase font-black tracking-widest text-center py-4">Equilibrium Detected</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Right Column */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-white/[0.02] border-white/5 rounded-[24px] backdrop-blur-xl hover:bg-white/[0.04] transition-colors overflow-hidden">
                                <div className="w-1 h-full absolute left-0 bg-destructive/40" />
                                <CardHeader className="pb-3 pt-6 px-6">
                                    <CardTitle className="text-[10px] font-black flex items-center gap-3 uppercase tracking-[0.3em] text-white/40">
                                        <AlertTriangle className="h-4 w-4 text-destructive" /> Recall Nexus
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 pt-1">
                                    <div className="flex items-start gap-4">
                                        <div className={cn("p-2 rounded-xl", !result.recallHistory.found ? "bg-green-500/10" : "bg-red-500/10")}>
                                            {!result.recallHistory.found ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                                        </div>
                                        <p className="text-[11px] text-white/60 font-black leading-relaxed mt-1 uppercase tracking-tight">{result.recallHistory.details}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/[0.02] border-white/5 rounded-[24px] backdrop-blur-xl hover:bg-white/[0.04] transition-colors overflow-hidden">
                                <div className="w-1 h-full absolute left-0 bg-blue-500/40" />
                                <CardHeader className="pb-3 pt-6 px-6">
                                    <CardTitle className="text-[10px] font-black flex items-center gap-3 uppercase tracking-[0.3em] text-white/40">
                                        <ShieldAlert className="h-4 w-4 text-blue-500" /> Regulatory Report
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 pt-1">
                                    <div className="flex items-start gap-4">
                                        <div className={cn("p-2 rounded-xl", result.fdaStatus.verified ? "bg-green-500/10" : "bg-blue-500/10")}>
                                            {result.fdaStatus.verified ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <ShieldAlert className="h-4 w-4 text-blue-400" />}
                                        </div>
                                        <p className="text-[11px] text-white/60 font-black leading-relaxed mt-1 uppercase tracking-tight">{result.fdaStatus.details}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {result.shippingInfo && (
                                <Card className="bg-white/[0.02] border-white/5 rounded-[24px] backdrop-blur-xl hover:bg-white/[0.04] transition-colors overflow-hidden col-span-1 md:col-span-2">
                                    <div className="w-1 h-full absolute left-0 bg-purple-500/40" />
                                    <CardHeader className="pb-3 pt-6 px-6">
                                        <CardTitle className="text-[10px] font-black flex items-center gap-3 uppercase tracking-[0.3em] text-white/40">
                                            <Truck className="h-4 w-4 text-purple-500" /> Logistics Intelligence
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6 pt-1">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 rounded-xl bg-purple-500/10">
                                                <CheckCircle2 className="h-4 w-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Shipping Analysis</h4>
                                                <p className="text-[11px] text-white/60 font-black leading-relaxed uppercase tracking-tight">{result.shippingInfo}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <Card className="border-white/5 bg-white/[0.015] shadow-2xl rounded-[32px] overflow-hidden backdrop-blur-md">
                            <CardHeader className="pb-6 pt-10 px-8">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-3 text-white/30">
                                    <FileText className="h-4 w-4 text-primary" /> Verification Matrix
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 px-8 pb-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {result.checklist.map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.06)" }}
                                            className="flex flex-col gap-3 p-5 rounded-[20px] bg-white/[0.03] border border-white/5 transition-all duration-500"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{item.label}</span>
                                                {item.status === 'pass' ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : item.status === 'fail' ? <XCircle className="h-4 w-4 text-red-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                            </div>
                                            <p className="text-[10px] text-white/70 font-black leading-relaxed uppercase opacity-80 italic tracking-tight">"{item.reason}"</p>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="pt-8 border-t border-white/5">
                                    {currentPriceVal && marketAverage ? (
                                        <PriceComparisonChart
                                            currentPrice={currentPriceVal}
                                            marketAverage={marketAverage}
                                            productName={result.title?.substring(0, 30)}
                                        />
                                    ) : (
                                        <PriceTrajectory data={result.priceHistory} />
                                    )}
                                </div>

                                <div className="pt-8 border-t border-white/5">
                                    <SellerIntelligence data={result.sellerReputation} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="relative overflow-hidden rounded-[40px] border border-white/5 shadow-2xl bg-black/20">
                            <div className={cn("p-10 space-y-10", !isPro && "blur-[100px] select-none scale-105 opacity-20")}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-3 text-white/30">
                                            <Search className="h-3 w-3" /> Sentiment extraction
                                        </h5>
                                        <ul className="space-y-4">
                                            {result.proAnalysis.reviewSummary.map((item, i) => (
                                                <li key={i} className="text-[11px] font-black text-white/60 flex gap-4 leading-relaxed uppercase tracking-tight">
                                                    <span className="text-primary mt-1 min-w-[4px] h-[4px] rounded-full bg-primary" /> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-6">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-3 text-white/30">
                                            <Zap className="h-3 w-3" /> Analysis Themes
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {result.proAnalysis.keyThemes?.map((theme, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="outline"
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.03] text-[9px] font-black uppercase tracking-widest",
                                                        theme.sentiment === 'positive' ? "text-green-400" : theme.sentiment === 'negative' ? "text-red-400" : "text-yellow-400"
                                                    )}
                                                >
                                                    {theme.theme} • {theme.count}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <Card className="bg-white/5 border-white/5 overflow-hidden rounded-3xl shadow-inner backdrop-blur-2xl">
                                    <div className="p-1">
                                        <ProductChat analysis={result} />
                                    </div>
                                </Card>
                            </div>
                            {!isPro && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-10 text-center">
                                    <Lock className="h-10 w-10 text-white/20 mb-6" />
                                    <h4 className="font-black text-2xl mb-2 uppercase tracking-tighter text-white">Unlock Full Intelligence</h4>
                                    <Button onClick={upgradeToPro} className="h-14 px-10 bg-white text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-primary hover:text-white transition-all duration-700 text-xs shadow-2xl mt-4">
                                        Initialize Pro
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Related Comparisons */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="pt-20 border-t border-white/5 mt-10"
            >
                <div className="flex items-center justify-between mb-12 px-2">
                    <h3 className="font-black text-[10px] uppercase tracking-[0.6em] flex items-center gap-4 text-white/30">
                        <Command className="h-4 w-4 text-primary" /> {query ? "Search Results" : (mode === 'website' ? "Trusted alternatives" : "Market discovery")}
                    </h3>
                    <div className="h-px flex-1 bg-white/5 mx-10 hidden sm:block" />
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Discovery Suite Active</p>
                </div>
                <DealsTable items={result.similarItems} query={query} />
            </motion.div>
        </div >
    );
}


export default function AnalyzePage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none appearance-none select-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/5 rounded-full filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-[128px] animate-pulse duration-1000" />
                <div className="absolute inset-0 bg-nebula" />
            </div>

            <Suspense fallback={null}>
                <AnalyzeContent />
            </Suspense>
        </div>
    );
}
