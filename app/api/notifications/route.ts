import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { timestamp: 'desc' },
            take: 20
        });
        return NextResponse.json(notifications);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Mark as read
        const body = await req.json();
        const { id, read } = body;

        if (id) {
            await prisma.notification.update({
                where: { id },
                data: { read: read ?? true }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    } catch (e) {
        console.error("Notification Update Error", e);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
