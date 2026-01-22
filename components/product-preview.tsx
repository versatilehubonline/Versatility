"use client";

import { useEffect, useState } from "react";
import { Loader2, ImageOff } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

interface ProductPreviewProps {
    url: string;
}

export function ProductPreview({ url }: ProductPreviewProps) {
    const [metadata, setMetadata] = useState<{ title: string; image: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        async function fetchMetadata() {
            try {
                const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setMetadata(data);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchMetadata();
    }, [url]);

    if (!mounted) return null;

    if (loading) {
        return (
            <Card className="mb-6 overflow-hidden border-white/5 bg-white/[0.02] rounded-[32px] animate-pulse">
                <CardContent className="p-6 flex items-center gap-6">
                    <div className="h-20 w-20 bg-white/5 rounded-2xl" />
                    <div className="space-y-3 flex-1">
                        <div className="h-4 w-1/3 bg-white/5 rounded" />
                        <div className="h-6 w-3/4 bg-white/5 rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !metadata) return null;

    return (
        <Card className="mb-10 overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[32px] shadow-2xl">
            <CardContent className="p-8 flex flex-col sm:flex-row items-center gap-8">
                <div className="relative h-32 w-32 sm:h-40 sm:w-40 shrink-0 overflow-hidden rounded-[24px] border-2 border-white/10 bg-black/40 shadow-2xl group">
                    {metadata.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={metadata.image}
                            alt={metadata.title}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/5">
                            <ImageOff className="h-12 w-12 text-white/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 opacity-60">Source Verification</p>
                    <h3 className="font-black text-2xl leading-tight text-white uppercase tracking-tight line-clamp-2 mb-2">{metadata.title}</h3>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest truncate max-w-md">{url}</p>
                </div>
            </CardContent>
        </Card>
    );
}
