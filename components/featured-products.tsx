"use client";

import React from "react";
import Link from "next/link";

import { motion } from "framer-motion";
import { Star, ShieldCheck, ArrowUpRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useCart } from "@/components/cart-provider";

import { PRODUCTS } from "@/data/products";

export function FeaturedProducts() {
    return (
        <section id="products" className="py-24 px-6 w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div className="space-y-2">
                    <h2 className="text-3xl md:text-5xl font-black text-white font-display tracking-tight uppercase">
                        Verified Picks
                    </h2>
                    <p className="text-muted-foreground font-medium max-w-md">
                        Curated heavily vetted products that outlast the trends.
                    </p>
                </div>
                <Button asChild variant="outline" className="rounded-full border-white/10 hover:bg-white/5 hover:text-white uppercase tracking-widest text-xs font-bold h-10 px-6">
                    <Link href="#products">
                        View All Categories <ArrowUpRight className="ml-2 w-3 h-3" />
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PRODUCTS.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                ))}
            </div>
        </section>
    );
}

function ProductCard({ product, index }: { product: typeof PRODUCTS[0], index: number }) {
    const { addItem } = useCart();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-[#0A0A0A] rounded-3xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors duration-500"
        >
            {/* Image Container */}
            <div className="aspect-[4/3] relative overflow-hidden bg-white/5">
                <Link href={`/analyze?query=${encodeURIComponent(product.title)}`} className="absolute inset-0 z-20" />

                {/* Badge */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                        <ShieldCheck className="w-3 h-3 text-primary fill-primary/20" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{product.rating}/100 Safe</span>
                    </div>
                </div>
                {product.badge && (
                    <div className="absolute top-4 right-4 z-10 pointer-events-none">
                        <div className="px-3 py-1 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-wider">
                            {product.badge}
                        </div>
                    </div>
                )}

                <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{product.category}</p>
                        <h3 className="text-xl font-bold text-white leading-tight">{product.title}</h3>
                    </div>
                    <p className="text-lg font-bold text-white">{product.price}</p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-4">
                    <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-white/60 font-medium">{product.reviews} reviews</span>
                    </div>
                    <Button
                        onClick={() => addItem(product)}
                        size="sm"
                        className="bg-white text-black hover:bg-primary hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors">
                        Add to Cart
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
