"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Bot, Send, User, Sparkles, Lock } from "lucide-react";
import { useUserTier } from "@/lib/user-tier-context";
import { cn } from "@/lib/utils";
import { AnalysisResult } from "@/lib/analyzer";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ProductChatProps {
    analysis: AnalysisResult;
}

export function ProductChat({ analysis }: ProductChatProps) {
    const { isUltimate, upgradeToUltimate } = useUserTier();
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: `Hi! I'm your Product Expert. Ask me anything about ${analysis.title}!` }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            // Build rich context from all available analysis data
            const richContext = `
PRODUCT ANALYSIS REPORT:
Title: ${analysis.title}
Price: ${analysis.price || 'Unknown'}
Reliability Score: ${analysis.score}/100 (${analysis.verdict})
Risk Level: ${analysis.riskLevel}

SAFETY ALERTS:
- FDA Status: ${analysis.fdaStatus.details}
- Recalls: ${analysis.recallHistory.details}

KEY FINDINGS:
${analysis.proAnalysis.finePrint.length > 0 ? "- Fine Print/Hidden Terms:\n" + analysis.proAnalysis.finePrint.map(s => `  * ${s}`).join("\n") : "- No suspicious fine print found."}
${analysis.proAnalysis.reviewSummary.length > 0 ? "- Review Consensus:\n" + analysis.proAnalysis.reviewSummary.map(s => `  * ${s}`).join("\n") : "- No review summary available."}

SELLER INFO:
- Rating: ${analysis.sellerReputation.rating}
- Details: ${analysis.sellerReputation.details}
${analysis.shippingInfo ? `- Shipping: ${analysis.shippingInfo}` : ""}

FULL PAGE CONTEXT (Snippet):
${(analysis.proAnalysis.fullContext || "").substring(0, 1000)}...
`;

            const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: apiMessages,
                    context: richContext
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
            } else {
                setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble connecting to the brain right now. Please try again." }]);
            }
        } catch (e) {
            console.error(e);
            setMessages((prev) => [...prev, { role: "assistant", content: "Connection error." }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isUltimate) {
        return (
            <Card className="h-[500px] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
                <Bot className="h-16 w-16 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-2">Ask Product AI</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                    Have specific questions? Upgrade to Ultimate to chat with our AI expert about safety, compatibility, and hidden flaws.
                </p>
                <Button onClick={upgradeToUltimate} size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl border-0">
                    <Sparkles className="mr-2 h-4 w-4" /> Unlock Ultimate - $15/mo
                </Button>
            </Card>
        );
    }

    return (
        <Card className="h-[600px] flex flex-col shadow-2xl border-primary/20">
            <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Product Intelligence Agent
                </CardTitle>
                <CardDescription>
                    Context-aware answers based on real analysis data.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                        {m.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                        )}
                        <div className={cn(
                            "rounded-lg px-4 py-2 max-w-[80%] text-sm",
                            m.role === "user"
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-muted text-foreground rounded-bl-none"
                        )}>
                            {m.content}
                        </div>
                        {m.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg rounded-bl-none px-4 py-3 flex items-center gap-1">
                            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 border-t bg-background">
                <form
                    className="flex w-full gap-2"
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                >
                    <Input
                        placeholder="E.g. Is this seller trustworthy? Does it contain gluten?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isTyping}
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
