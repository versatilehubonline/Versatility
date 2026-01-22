import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { fetchCurrentPrice } from "@/lib/scraper";

export const dynamic = 'force-dynamic'; // Prevent caching
export const maxDuration = 300; // Allow 5 minutes runtime (Vercel max for Pro)

export async function GET(req: NextRequest) {
    // Basic security: Check for an authorization header (Cron Secret)
    // In production, set CRON_SECRET env var and configure your cron job to send it
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const products = await prisma.product.findMany();

        const results = [];

        for (const product of products) {
            try {
                const price = await fetchCurrentPrice(product.url);

                if (price) {
                    await prisma.pricePoint.create({
                        data: {
                            productId: product.id,
                            price: price,
                            currency: "USD"
                        }
                    });

                    // Check for Alerts
                    // Find all favorites for this product (via URL matching since relation might be loose) where targetPrice >= price
                    // Or distinct favorites linked to this product ID
                    const alerts = await prisma.favorite.findMany({
                        where: {
                            OR: [
                                { productId: product.id },
                                { url: product.url }
                            ],
                            targetPrice: { gte: price }
                        }
                    });

                    for (const alert of alerts) {
                        // Avoid duplicate alerts? (Check if recently notified?)
                        // For demo, we just create one. In real app, check last notification time.
                        await prisma.notification.create({
                            data: {
                                type: 'price_drop',
                                title: 'Price Drop Alert!',
                                message: `Good news! ${product.title.substring(0, 30)}... dropped to $${price} (Target: $${alert.targetPrice})`,
                                link: `/analyze?url=${encodeURIComponent(product.url)}`,
                                read: false
                            }
                        });
                    }

                    results.push({ id: product.id, status: 'updated', price, alertsTriggered: alerts.length });
                } else {
                    results.push({ id: product.id, status: 'failed_scrape' });
                }
            } catch (err) {
                console.error(`Failed to update product ${product.id}`, err);
                results.push({ id: product.id, status: 'error', error: String(err) });
            }

            // Simple delay to avoid rate limiting if loop is fast
            await new Promise(r => setTimeout(r, 1000));
        }

        return NextResponse.json({
            success: true,
            processed: products.length,
            results
        });

    } catch (e) {
        console.error("Cron Error", e);
        return NextResponse.json({ error: "Cron Job Failed" }, { status: 500 });
    }
}
