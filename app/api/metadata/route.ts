
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; ReliabilityChecker/1.0)",
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch URL" }, { status: response.status });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const title = $('meta[property="og:title"]').attr("content") || $('title').text() || "Unknown Product";
        const image = $('meta[property="og:image"]').attr("content") || "";

        // Fallback for image if og:image is missing (try first img tag)
        const finalImage = image || $('img').first().attr('src') || "";

        return NextResponse.json({ title, image: finalImage });
    } catch (error) {
        console.error("Metadata fetch error:", error);
        return NextResponse.json({ error: "Failed to parse metadata" }, { status: 500 });
    }
}
