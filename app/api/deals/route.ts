
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch recent high-scoring scans
        // We want items that are at least SECURE (score >= 80)
        // We fetching slightly more to filter duplicates
        const scans = await prisma.scanResult.findMany({
            where: {
                score: { gte: 80 }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 100,
            include: {
                product: {
                    include: {
                        priceHistory: {
                            orderBy: { timestamp: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        // Deduplicate by URL and format
        const seen = new Set();
        const deals = [];

        for (const scan of scans) {
            if (seen.has(scan.url)) continue;
            seen.add(scan.url);

            const product = scan.product;
            const latestPrice = product?.priceHistory?.[0];

            // If strictly deals, maybe we filter by price existing?
            // For now, list them.

            deals.push({
                id: product?.id || scan.id,
                url: scan.url,
                title: product?.title || scan.title,
                image: product?.image || null, // Image might not be in product if we didn't save it? 
                // Wait, Product schema has image. But analyze/history doesn't save image to Product?
                // app/api/history doesn't save image to Product. I need to fix that too if I want images.
                // Assuming Product has image if scraper coverage improves.
                score: scan.score,
                verdict: scan.verdict,
                price: latestPrice?.price || null,
                timestamp: scan.timestamp
            });
        }

        return NextResponse.json(deals.slice(0, 50));

    } catch (error) {
        console.error("Deals API Error:", error);
        return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 });
    }
}
