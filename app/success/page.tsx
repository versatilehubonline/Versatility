"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserTier } from "@/lib/user-tier-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PartyPopper, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { finalizeTier } = useUserTier();
    const [seconds, setSeconds] = useState(5);

    const tier = searchParams.get("tier");
    const sessionId = searchParams.get("session_id");

    // Determine context: Order vs Subscription Upgrade
    const isOrder = searchParams.get("source") === "order" || !tier || tier === "null";

    useEffect(() => {
        // Only trigger tier upgrade if it's explicitly a subscription flow
        if (!isOrder && (tier === "pro" || tier === "ultimate")) {
            finalizeTier(tier as any);
        }

        // Auto redirect countdown
        const timer = setInterval(() => {
            setSeconds((s) => {
                if (s <= 1) {
                    clearInterval(timer);
                    router.push(isOrder ? "/" : "/analyze");
                    return 0;
                }
                return s - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [tier, finalizeTier, router, isOrder]);

    const handleContinue = () => {
        router.push(isOrder ? "/" : "/analyze");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
            >
                <Card className="max-w-md w-full text-center border-t-4 border-t-green-500 shadow-2xl">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <PartyPopper className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {isOrder ? "Order Placed!" : "Payment Successful!"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            {isOrder ? (
                                <>Your order has been placed successfully. You will receive an email confirmation shortly.</>
                            ) : (
                                <>You have successfully upgraded to <strong>{tier === "ultimate" ? "Ultimate" : "Pro"}</strong>. All premium features are now unlocked.</>
                            )}
                        </p>

                        <div className="bg-muted p-4 rounded-lg text-sm">
                            <div className="flex items-center justify-center gap-2 text-foreground font-medium mb-1">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Transaction Verified
                            </div>
                            <p className="text-muted-foreground text-xs">Session ID: {sessionId ? sessionId.slice(0, 10) + "..." : "N/A"}</p>
                        </div>

                        <Button onClick={handleContinue} className="w-full gap-2 group">
                            Return to App <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <p className="text-xs text-muted-foreground">
                            Redirecting in {seconds}s...
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
