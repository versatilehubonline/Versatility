import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json([], { status: 401 });

        const favorites = await prisma.favorite.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' }
        });
        return NextResponse.json(favorites);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { url, title, price, image, score, verdict, targetPrice } = body;

        console.log("Saving favorite for user", userId, url);

        if (!url || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Upsert logic: if exists, update timestamp to top
        // Scope by userId!
        const existing = await prisma.favorite.findFirst({
            where: { url, userId }
        });

        let result;
        if (existing) {
            result = await prisma.favorite.update({
                where: { id: existing.id },
                data: {
                    title, price, image, score, verdict, timestamp: new Date(),
                    targetPrice: targetPrice !== undefined ? targetPrice : existing.targetPrice
                    // userId matches automatically since we found it by userId
                }
            });
        } else {
            // Ensure product exists globally
            const product = await prisma.product.upsert({
                where: { url },
                update: {},
                create: { url, title, image, description: "" }
            });

            result = await prisma.favorite.create({
                data: {
                    url, title, price, image, score, verdict,
                    targetPrice: targetPrice || null,
                    productId: product.id,
                    userId // Link to user
                }
            });
        }

        return NextResponse.json(result);
    } catch (e) {
        console.error("POST Favorite Error", e);
        return NextResponse.json({ error: "Failed to save favorite" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const url = searchParams.get("url");

        if (!url) {
            return NextResponse.json({ error: "Missing URL" }, { status: 400 });
        }

        // Delete only user's favorite
        await prisma.favorite.deleteMany({
            where: { url, userId }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
    }
}
