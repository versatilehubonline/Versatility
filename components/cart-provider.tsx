"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { PRODUCTS } from "@/data/products";

// Define the shape of a cart item
export type CartItem = typeof PRODUCTS[0] & { quantity: number };

interface CartContextType {
    items: CartItem[];
    addItem: (product: typeof PRODUCTS[0]) => void;
    updateQuantity: (productId: number, delta: number) => void;
    removeItem: (productId: number) => void;
    totalItems: number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("versafied-cart");
            if (saved) {
                setItems(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load cart", e);
        }
        setIsLoaded(true);
    }, []);

    // Save to local storage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("versafied-cart", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addItem = (product: typeof PRODUCTS[0]) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsOpen(true);
    };

    const updateQuantity = (productId: number, delta: number) => {
        setItems(prev => prev.map(item => {
            if (item.id === productId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const removeItem = (productId: number) => {
        setItems(prev => prev.filter(i => i.id !== productId));
    };

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, totalItems, isOpen, setIsOpen }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
