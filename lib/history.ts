"use client";

import { useState, useEffect } from "react";

export interface HistoryItem {
    url: string;
    title: string;
    timestamp: string | number;
    score: number;
    risk: 'Safe' | 'Moderate' | 'High Risk';
    price?: number | string;
    image?: string | null;
}

export function useHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        // Load from API on mount
        fetch('/api/history')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setHistory(data);
            })
            .catch(err => console.error("Failed to fetch history", err));
    }, []);

    const addToHistory = async (item: Omit<HistoryItem, "timestamp">) => {
        // Optimistic UI
        setHistory((prev) => {
            const filtered = prev.filter((i) => i.url !== item.url);
            const newItem = { ...item, timestamp: Date.now() };
            return [newItem, ...filtered].slice(0, 50);
        });

        // Sync with API
        try {
            await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
        } catch (e) {
            console.error("Failed to save history", e);
        }
    };

    const clearHistory = async () => {
        setHistory([]);
        try {
            await fetch('/api/history', { method: 'DELETE' });
        } catch (e) {
            console.error("Failed to clear history", e);
        }
    };

    return { history, addToHistory, clearHistory };
}
