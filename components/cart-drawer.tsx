"use client";

import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function CartDrawer() {
    const { items, removeItem, totalItems, isOpen, setIsOpen, updateQuantity } = useCart();
    const pathname = usePathname();

    // Close drawer on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname, setIsOpen]);

    // Calculate total price
    const subtotal = items.reduce((acc, item) => {
        const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
        return acc + (isNaN(price) ? 0 : price * item.quantity);
    }, 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-white/10 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold font-display">Your Cart <span className="text-white/50 text-base font-normal">({totalItems})</span></h2>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-white/50">
                                    <ShoppingBag className="w-16 h-16 opacity-20" />
                                    <p>Your cart is empty.</p>
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>Start Shopping</Button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="relative w-20 h-20 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.image ? (
                                                <Image src={item.image} alt={item.title} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/10 text-xs text-white/30">No Img</div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-medium line-clamp-2 text-sm leading-tight mb-1">{item.title}</h3>
                                                <p className="text-sm text-primary font-bold">{item.price}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center bg-white/5 rounded-md">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="p-1 hover:text-primary transition-colors"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-xs w-6 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="p-1 hover:text-primary transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <button onClick={() => removeItem(item.id)} className="text-white/40 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-lg">
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">Subtotal</span>
                                        <span className="font-bold">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">Shipping</span>
                                        <span className="text-green-400">Free</span>
                                    </div>
                                </div>
                                <Button asChild className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20" size="lg">
                                    <Link href="/checkout">
                                        Checkout Now <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
