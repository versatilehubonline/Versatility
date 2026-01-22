"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface InfoTooltipProps {
    content: string;
    side?: "top" | "bottom" | "left" | "right";
}

export function InfoTooltip({ content, side = "top" }: InfoTooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
        <div
            className="relative inline-flex items-center ml-2"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />

            {isVisible && (
                <div className={cn(
                    "absolute z-50 w-64 p-3 text-xs bg-popover text-popover-foreground rounded-md shadow-md border animate-in fade-in-0 zoom-in-95",
                    side === "top" && "bottom-full mb-2 left-1/2 -translate-x-1/2",
                    side === "bottom" && "top-full mt-2 left-1/2 -translate-x-1/2",
                )}>
                    {content}
                    {/* Arrow */}
                    <div className={cn(
                        "absolute w-2 h-2 bg-popover rotate-45 border-r border-b",
                        side === "top" && "-bottom-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0",
                        side === "bottom" && "-top-1 left-1/2 -translate-x-1/2 border-r-0 border-b-0 border-t border-l bg-popover"
                    )} />
                </div>
            )}
        </div>
    );
}
