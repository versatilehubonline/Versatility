"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type UserTier = "free" | "pro" | "ultimate";

interface UserTierContextType {
    tier: UserTier;
    isPro: boolean;
    isUltimate: boolean;
    upgradeToPro: () => void;
    upgradeToUltimate: () => void;
    downgradeToFree: () => void;
    finalizeTier: (tier: UserTier) => void;
}

const UserTierContext = createContext<UserTierContextType | undefined>(undefined);

export function UserTierProvider({ children }: { children: ReactNode }) {
    const [tier, setTier] = useState<UserTier>("free");

    const isPro = tier === "pro" || tier === "ultimate";
    const isUltimate = tier === "ultimate";

    const finalizeTier = (newTier: UserTier) => {
        setTier(newTier);
        // Persist to local storage if needed, but context helps for now
    };

    const upgradeToPro = async () => {
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: "pro" })
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (e) {
            console.error(e);
        }
    };

    const upgradeToUltimate = async () => {
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: "ultimate" })
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (e) {
            console.error(e);
        }
    };

    const downgradeToFree = () => setTier("free");

    return (
        <UserTierContext.Provider value={{ tier, isPro, isUltimate, upgradeToPro, upgradeToUltimate, downgradeToFree, finalizeTier }}>
            {children}
        </UserTierContext.Provider>
    );
}

export function useUserTier() {
    const context = useContext(UserTierContext);
    if (context === undefined) {
        throw new Error("useUserTier must be used within a UserTierProvider");
    }
    return context;
}
