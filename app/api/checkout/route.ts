
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe (use a placeholder if missing to avoid build crash, but runtime will need it)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    // @ts-ignore
    apiVersion: "2024-12-18.acacia", // Use latest API version ts-ignore if needed
});

export async function POST(req: NextRequest) {
    try {
        const { tier } = await req.json();

        if (!tier || (tier !== "pro" && tier !== "ultimate")) {
            return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }

        const origin = req.headers.get("origin") || "http://localhost:3000";

        // MOCK MODE if no key provided
        if (!process.env.STRIPE_SECRET_KEY) {
            console.log("Mocking Stripe Checkout (No API Key found)");
            // Redirect to our success page immediately with a fake session
            return NextResponse.json({
                url: `${origin}/success?session_id=mock_session_123&tier=${tier}`
            });
        }

        // Define Price IDs (You would normally use Env Vars for these too)
        const priceId = tier === "pro"
            ? "price_1Q..." // Replace with your real Stripe Price ID for Pro
            : "price_1Q..."; // Replace with Ultimate Price ID

        // Dynamic Line items construction
        // If we don't have real IDs, we can create ad-hoc line items for testing if Price IDs aren't set up yet
        const line_items = [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: tier === "pro" ? "TrustCheck Pro" : "TrustCheck Ultimate",
                        description: tier === "pro" ? "Unlock deep analysis & hidden fees scanner." : "Unlock AI Product Agent & full history.",
                    },
                    unit_amount: tier === "pro" ? 500 : 1500, // $5.00 or $15.00
                    recurring: {
                        interval: "month" as const,
                    },
                },
                quantity: 1,
            },
        ];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_items,
            mode: "subscription",
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
            cancel_url: `${origin}/analyze`, // Go back to analysis if canceled
            metadata: {
                tier: tier
            }
        });

        return NextResponse.json({ url: session.url });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}
