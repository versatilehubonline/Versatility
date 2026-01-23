import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentPrice } from "@/lib/scraper";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    try {
        const currentPrice = await fetchCurrentPrice(url);

        if (!currentPrice) {
            return NextResponse.json({
                currentPrice: null,
                priceHistory: [],
                message: "Could not extract price. Page structure may not be supported."
            });
        }

        // Fetch real history from DB if product exists
        let historyData = [{ date: new Date().toISOString().split('T')[0], price: currentPrice }];

        try {
            const product = await prisma.product.findUnique({
                where: { url },
                include: {
                    priceHistory: {
                        orderBy: { timestamp: 'asc' }
                    }
                }
            });

            if (product && product.priceHistory.length > 0) {
                historyData = product.priceHistory.map((p: { timestamp: Date; price: number }) => ({
                    date: p.timestamp.toISOString().split('T')[0],
                    price: p.price
                }));
                // Append current if not already roughly there? 
                // Actually cron will handle history, this endpoint is just for "Viewing"
                // But let's append current live price just in case cron hasn't run today
                const today = new Date().toISOString().split('T')[0];
                const lastDate = historyData[historyData.length - 1].date;
                if (lastDate !== today) {
                    historyData.push({ date: today, price: currentPrice });
                }
            } else {
                // Optimization: If valid product found but no history, save this first point!
                // This "auto-tracks" any product someone analyzes
                if (currentPrice) {
                    await prisma.product.upsert({
                        where: { url },
                        update: {},
                        create: {
                            url,
                            title: "Tracked Product",
                            priceHistory: {
                                create: { price: currentPrice, currency: 'USD' }
                            }
                        }
                    });
                }
            }
        } catch (dbErr) {
            console.warn("DB History fetch failed", dbErr);
        }

        return NextResponse.json({
            currentPrice,
            // In the future, this will fetch from Prisma 'PricePoint' table
            priceHistory: historyData,
            message: "Successfully extracted current price."
        });

    } catch (error) {
        console.error("Price extraction error:", error);
        return NextResponse.json({
            error: "Failed to extract price",
            currentPrice: null,
            priceHistory: []
        }, { status: 500 });
    }
}
