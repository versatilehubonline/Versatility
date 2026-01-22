"use client";

import Link from "next/link";
import { ShoppingBag, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";

import { NotificationCenter } from "@/components/notification-center";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
    const { totalItems, isOpen, setIsOpen } = useCart();
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
            <nav className="pointer-events-auto flex items-center gap-2 p-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

                {/* Logo / Home */}
                <Link href="/" className="pl-4 pr-6 py-2">
                    <span className="font-display font-black tracking-tighter text-lg text-white">
                        VERSA<span className="text-primary">FIED</span>
                    </span>
                </Link>

                {/* Links */}
                <div className="hidden md:flex items-center gap-1">
                    <NavItem href="/deals">Deals</NavItem>
                    <NavItem href="/extension">Tools</NavItem>
                    <NavItem href="/">Verify URL</NavItem>
                    {/* <NavItem href="/about">Mission</NavItem> */}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pl-2 border-l border-white/10 ml-2">
                    <NotificationCenter />
                    <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-white/10 text-white/70 hover:text-white">
                        <Search className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => setIsOpen(!isOpen)} variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-white/10 text-white/70 hover:text-white relative">
                        <ShoppingBag className="w-4 h-4" />
                        {totalItems > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                        )}
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-primary text-[10px] font-bold text-black rounded-full">
                                {totalItems}
                            </span>
                        )}
                    </Button>

                    {/* Auth UI */}
                    <div className="pl-2 ml-1 border-l border-white/10 flex items-center">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <Button size="sm" className="rounded-full h-8 px-4 bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-widest">Sign In</Button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "h-8 w-8"
                                    }
                                }}
                            />
                        </SignedIn>
                    </div>
                </div>

            </nav>
        </header>
    );
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-all"
        >
            {children}
        </Link>
    );
}
