import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { UserTierProvider } from "@/lib/user-tier-context";
import { cn } from "@/lib/utils";
import { HistorySidebar } from "@/components/history-sidebar";
import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/components/cart-provider";
import { CartDrawer } from "@/components/cart-drawer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "TrustCheck | Product Reliability Analyzer",
  description: "AI-powered product safety and reliability analysis.",
};

import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            inter.variable,
            outfit.variable
          )}
        >
          <UserTierProvider>
            <CartProvider>
              <Navbar />
              <HistorySidebar />
              <CartDrawer />
              {children}
            </CartProvider>
          </UserTierProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
