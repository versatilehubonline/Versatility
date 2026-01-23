
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Maximize2, Bookmark, CheckCircle2, Laptop } from "lucide-react";
import { motion } from "framer-motion";

export default function ExtensionPage() {
    // The Bookmarklet Code
    // 1. Gets current URL
    // 2. Encodes it
    // 3. Redirects to https://versafied.app/analyze?url=... (or localhost for dev)
    // Note: In production this should point to the real domain.
    const bookmarkletCode = `javascript:(function(){window.location.href='http://localhost:3000/analyze?url='+encodeURIComponent(window.location.href)})();`;

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-6 md:px-12 relative overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none appearance-none select-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[128px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-black tracking-widest"
                    >
                        <Laptop className="w-3 h-3" /> Browser Tools
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black tracking-tighter"
                    >
                        Verify Products <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">Instantly</span>
                    </motion.h1>
                    <p className="text-white/40 max-w-2xl mx-auto text-lg leading-relaxed">
                        Don't manually copy-paste URLs. Use our smart bookmarklet to analyze products directly from Amazon, eBay, or Walmart with one click.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <Card className="bg-white/[0.03] border-white/5 backdrop-blur-xl rounded-[32px] overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Bookmark className="w-5 h-5 text-primary" />
                                Install Bookmarklet
                            </CardTitle>
                            <CardDescription>
                                Drag the button below to your bookmarks bar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-10 space-y-6 transition-all">
                            <a
                                href={bookmarkletCode}
                                className="cursor-move"
                                title="Drag me to bookmarks"
                                onClick={(e) => e.preventDefault()}
                            >
                                <Button className="h-16 px-8 rounded-full text-lg font-black tracking-widest uppercase bg-gradient-to-r from-primary to-blue-600 hover:scale-105 transition-transform shadow-2xl shadow-primary/20 cursor-grab active:cursor-grabbing">
                                    Verify with Versafied
                                </Button>
                            </a>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                                ↖ Drag this button to your browser bar
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] border-white/5 backdrop-blur-xl rounded-[32px] overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                How to use
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                "Go to any product page (Amazon, eBay, etc.)",
                                "Click the 'Verify with Versafied' bookmark",
                                "Instantly see the safety report & deal checks"
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white/50">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm font-medium text-white/80">{step}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
