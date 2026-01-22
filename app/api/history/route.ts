import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json([], { status: 401 });

        const history = await prisma.scanResult.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
            take: 50 // Limit to recent 50
        });
        return NextResponse.json(history);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        // Note: Analysis is public. Updating Global Product Data is public.
        // Saving to specific User History requires auth.

        const body = await req.json();
        const { url, title, score, risk, verdict } = body;

        console.log("Analyzing", url, "User:", userId);

        if (!url) {
            return NextResponse.json({ error: "Missing URL" }, { status: 400 });
        }

        // DB: Create or Update Product and add ScanResult
        const product = await prisma.product.upsert({
            where: { url },
            update: {
                updatedAt: new Date(),
                image: body.image || undefined, // Update image if provided
                // If we have a price, we should add a price point
                priceHistory: body.price ? {
                    create: {
                        // Parse price string to float
                        price: parseFloat((body.price as string).replace(/[^0-9.]/g, '')) || 0
                    }
                } : undefined
            },
            create: {
                url,
                title,
                image: body.image || null,
                priceHistory: body.price ? {
                    create: {
                        price: parseFloat((body.price as string).replace(/[^0-9.]/g, '')) || 0
                    }
                } : undefined
            }
        });

        // Only save to personal history if logged in
        if (userId) {
            await prisma.scanResult.create({
                data: {
                    url,
                    title,
                    score,
                    risk,
                    verdict: score >= 90 ? 'LEGIT' : score >= 80 ? 'SECURE' : score >= 50 ? 'CAUTION' : 'DANGER',
                    productId: product.id,
                    userId
                }
            });
        }

        return NextResponse.json({ success: true, saved: !!userId });
    } catch (e) {
        console.error("POST History Error", e);
        return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Clear history for user
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await prisma.scanResult.deleteMany({
            where: { userId }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
    }
}
