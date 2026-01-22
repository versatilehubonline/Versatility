"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    timestamp: string;
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        // Poll every 60s
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (id: string, link?: string) => {
        // Optimistic
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, read: true })
            });
        } catch (e) { }

        if (link) {
            setOpen(false);
            router.push(link);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="relative w-10 h-10 rounded-full">
                    <Bell className="w-5 h-5 text-white/60" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#050505]" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl" align="end">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-white/50">Notifications</h4>
                    {unreadCount > 0 && (
                        <span className="text-[9px] font-bold bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    <div className="divide-y divide-white/5">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                                <Bell className="w-8 h-8 text-white/10 mb-3" />
                                <p className="text-xs text-white/30">No notifications yet.</p>
                            </div>
                        ) : (
                            notifications.map(item => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "p-4 hover:bg-white/5 transition-colors cursor-pointer relative group",
                                        !item.read && "bg-blue-500/5 hover:bg-blue-500/10"
                                    )}
                                    onClick={() => markAsRead(item.id, item.link)}
                                >
                                    {!item.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                    )}
                                    <h5 className={cn("text-xs font-bold mb-1", !item.read ? "text-white" : "text-white/50")}>
                                        {item.title}
                                    </h5>
                                    <p className="text-[11px] text-white/60 leading-relaxed">
                                        {item.message}
                                    </p>
                                    <span className="text-[9px] text-white/20 mt-2 block font-mono">
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
