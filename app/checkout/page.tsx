"use client";

import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Truck, CreditCard, Lock, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUserTier } from "@/lib/user-tier-context";

export default function CheckoutPage() {
    const { items, totalItems, removeItem } = useCart();
    const router = useRouter();
    const { tier } = useUserTier();
    const [isProcessing, setIsProcessing] = useState(false);

    // Redirect empty cart
    useEffect(() => {
        if (items.length === 0) {
            router.push("/");
        }
    }, [items, router]);

    const subtotal = items.reduce((acc, item) => {
        const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
        return acc + (isNaN(price) ? 0 : price * item.quantity);
    }, 0);

    const shipping = 0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Clear cart (simulated)
        items.forEach(item => removeItem(item.id));

        // Redirect to success
        const sessionId = Math.random().toString(36).substring(7);
        router.push(`/success?session_id=${sessionId}&tier=${tier}&source=order`);
    };

    if (items.length === 0) return null;

    return (
        <div className="min-h-screen py-32 px-4 max-w-6xl mx-auto">
            <h1 className="text-4xl font-display font-bold mb-8">Checkout</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Forms */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Shipping */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-primary" /> Shipping Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" placeholder="John" required />
                                </div>
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" placeholder="Doe" required />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" placeholder="123 Main St" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" placeholder="New York" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zip">Zip Code</Label>
                                    <Input id="zip" placeholder="10001" required />
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" /> Payment Details
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 text-xs text-green-400">
                                <Lock className="w-3 h-3" /> Secure 256-bit SSL Encrypted
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Card Number</Label>
                                    <Input placeholder="0000 0000 0000 0000" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Expiration</Label>
                                        <Input placeholder="MM/YY" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CVC</Label>
                                        <Input placeholder="123" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Summary */}
                <div className="space-y-6">
                    <Card className="sticky top-32">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 text-sm">
                                        <div className="relative w-12 h-12 bg-white/5 rounded overflow-hidden flex-shrink-0">
                                            {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium line-clamp-2">{item.title}</p>
                                            <p className="text-white/50">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="font-bold">{item.price}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/60">Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/60">Shipping</span>
                                    <span className="text-green-400">Free</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/60">Tax (8%)</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2 mt-2">
                                    <span>Total</span>
                                    <span className="text-primary">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button onClick={handlePlaceOrder} className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20" size="lg" disabled={isProcessing}>
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>Pay ${total.toFixed(2)}</>
                                )}
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Verified Secure Checkout</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
