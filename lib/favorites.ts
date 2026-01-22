"use client";

import { useState, useEffect } from "react";

export interface FavoriteItem {
    url: string;
    title: string;
    price: string | null;
    image: string | null;
    timestamp: string | number;
    score: number;
    verdict: string;
    targetPrice?: number;
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [mounted, setMounted] = useState(false);

    // Initial Fetch
    useEffect(() => {
        setMounted(true);
        fetch('/api/favorites')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setFavorites(data);
            })
            .catch(err => console.error("Failed to fetch favorites", err));
    }, []);

    const toggleFavorite = async (item: Omit<FavoriteItem, "timestamp">) => {
        const exists = favorites.find((i) => i.url === item.url);

        let shouldDelete = false;

        // Logic: 
        // 1. If we are just toggling (no specific targetPrice change implied), removes it.
        // 2. If we are explicitly calling this to set targetPrice, we should UPDATE not delete.

        if (exists) {
            // Check if this is an "Update" or a "Toggle Off"
            // If the incoming item has a targetPrice that differs, treat as update.
            // But usually this function is called by the "Heart" button which implies toggle.
            // The "TargetPriceInput" also calls this. 
            // We need to differentiate.
            // Simple heuristic: If targetPrice is provided and different, it's an update.
            if (item.targetPrice !== undefined && item.targetPrice !== exists.targetPrice) {
                // Update local
                setFavorites(prev => prev.map(i => i.url === item.url ? { ...i, ...item } : i));

                // API Update
                try {
                    await fetch('/api/favorites', {
                        method: 'POST', // POST handles upsert/update
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item)
                    });
                } catch (e) { }
                return;
            } else if (item.targetPrice === undefined) {
                // Classic Toggle Off
                shouldDelete = true;
            }
        }

        // Optimistic UI Update
        if (shouldDelete) {
            setFavorites(prev => prev.filter(i => i.url !== item.url));
        } else if (!exists) {
            setFavorites(prev => [{ ...item, timestamp: Date.now() }, ...prev]);
        }

        try {
            if (shouldDelete) {
                // DELETE
                await fetch(`/api/favorites?url=${encodeURIComponent(item.url)}`, { method: 'DELETE' });
            } else if (!exists) {
                // POST (Create)
                await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
            }
        } catch (e) {
            console.error("Failed to sync favorite", e);
        }
    };

    const isFavorite = (url: string) => {
        return favorites.some((i) => i.url === url);
    };

    return { favorites, toggleFavorite, isFavorite, mounted };
}
