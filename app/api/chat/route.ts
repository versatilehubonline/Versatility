
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { messages, context } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        // Mock fallback if no API key (for development/demo without cost)
        if (!apiKey) {
            const lastUserMsg = messages[messages.length - 1].content.toLowerCase();

            // Allow the user to see it's working technically even without a key
            // Simple heuristic to extract something relevant from the new text format
            const hasSafetyWarning = context.includes("Safety Alerts") && !context.includes("No active recalls");
            const scoreMatch = context.match(/Reliability Score: (\d+)/);
            const score = scoreMatch ? scoreMatch[1] : "unknown";

            let advice = `Based on the reliability score of ${score}, this product seems ${parseInt(score) > 70 ? "generally safe" : "risky"}.`;
            if (hasSafetyWarning) advice += " However, please note the safety alerts mentioned in the report.";

            return NextResponse.json({
                role: "assistant",
                content: `(Demo Mode: Real AI disabled)\n\n${advice}\n\nSince I'm in demo mode, I can't generate a custom answer for "${lastUserMsg}", but I recommend reviewing the "Key Findings" section above for details on fine print and reviews.`
            });
        }

        // REAL OPENAI CALL
        const systemPrompt = `You are an expert Consumer Protection Analyst for Versafied.
        Your goal is to protect the user by analyzing the provided product report.
        
        CONTEXT STRUCTURE:
        The context provided below contains a structured report including:
        - Reliability Score & Verdict
        - Safety Alerts (FDA, Recalls)
        - Hidden Fine Print
        - Review Summaries
        - Seller Reputation
        
        GUIDELINES:
        1. BE DIRECT: If the score is low or there are safety alerts, start with a warning.
        2. USE DATA: Reference specific fine print or review complaints from the context.
        3. BE CONCISE: keep answers under 3 sentences unless asked for detail.
        4. IF UNKNOWN: If the context is missing specific details (e.g. ingredients), admit it rather than guessing.
        
        PRODUCT REPORT CONTEXT:
        ${context}
        `;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // Cost-effective
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenAI Error:", err);
            return NextResponse.json({ error: "AI Service Error" }, { status: 500 });
        }

        const data = await response.json();
        const aiMessage = data.choices[0].message;

        return NextResponse.json(aiMessage);

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
