
async function fetchPriceHistory(url: string): Promise<{ date: string; price: number }[] | undefined> {
    // Skip price fetching on server-side or if window is not available
    if (typeof window === 'undefined') {
        return undefined;
    }

    try {
        const res = await fetch(`/api/price-history?url=${encodeURIComponent(url)}`);
        if (!res.ok) return undefined;
        const data = await res.json();
        return data.priceHistory || undefined;
    } catch (e) {
        console.warn("Price history fetch failed", e);
        return undefined;
    }
}

export interface AnalysisResult {
    title: string;
    score: number; // Kept internally for mapping and similar items
    verdict: 'LEGIT' | 'SECURE' | 'NEUTRAL' | 'CAUTION' | 'RISKY' | 'DANGER';
    riskLevel: 'Safe' | 'Moderate' | 'High Risk';
    summary: string;
    price?: string;
    image?: string;
    fdaStatus: {
        verified: boolean;
        details: string;
    };
    recallHistory: {
        found: boolean;
        details: string;
    };
    compliance: {
        ul: boolean;
        fcc: boolean;
        ce: boolean;
        rohs: boolean;
    };
    proAnalysis: {
        finePrint: string[];
        reviewSummary: string[];
        urgencyScore: number;
        dropshippingScore: number;
        fullContext?: string;
        keyThemes?: {
            theme: string;
            sentiment: 'positive' | 'negative' | 'neutral';
            count: number;
        }[];
    };
    sellerReputation: {
        rating: number;
        details: string;
        accountAge?: string;
        location?: string;
        fulfillmentRate?: number;
    };
    priceHistory?: {
        date: string;
        price: number;
    }[];
    shippingInfo: string | null;
    checklist: {
        label: string;
        status: 'pass' | 'fail' | 'warning';
        reason: string;
    }[];
    similarItems: {
        title: string;
        url: string;
        score: number;
        verdict?: string;
        image?: string;
        price?: string;
        source: string;
        shipping?: string;
        condition?: string;
    }[];
    scoreFactors: {
        label: string;
        value: number;
        type: 'bonus' | 'deduction';
    }[];
}

export async function analyzeProduct(url: string, mode: 'product' | 'website' = 'product', searchQuery?: string): Promise<AnalysisResult> {
    const isAmazon = url.includes("amazon.com");

    let apiData: any = {};
    try {
        const res = await fetch(`/api/analyze`, {
            method: 'POST',
            body: JSON.stringify({ url, mode, searchQuery }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) apiData = await res.json();
    } catch (e) {
        console.warn("Analysis API failed", e);
    }

    const hasRecall = !!apiData.safety?.cpsc;
    const hasFDA = !!apiData.safety?.fda;

    // SCORING
    // Prefer API provided score/verdict if available to maintain single source of truth
    let score = apiData.score ?? (mode === 'website' ? apiData.trustScore || 80 : 80);
    const scoreFactors: AnalysisResult['scoreFactors'] = apiData.scoreFactors || [];

    if (!apiData.scoreFactors && mode === 'product') {
        // Fallback local scoring logic (legacy)
        if (hasRecall) { score -= 40; scoreFactors.push({ label: "Active CPSC Recall", value: -40, type: 'deduction' }); }
        if (hasFDA) { score -= 20; scoreFactors.push({ label: "FDA Enforcement Action", value: -20, type: 'deduction' }); }
        if (apiData.urgencyScore > 0) { score -= 15; scoreFactors.push({ label: "High-pressure sales loop", value: -15, type: 'deduction' }); }
        if (apiData.dropshippingScore > 0) { score -= 25; scoreFactors.push({ label: "Dropshipping source markers", value: -25, type: 'deduction' }); }
        if (isAmazon) { score += 10; scoreFactors.push({ label: "Verified Marketplace (Amazon)", value: 10, type: 'bonus' }); }
    } else if (!apiData.scoreFactors) {
        if (!url.startsWith('https')) scoreFactors.push({ label: "Insecure Store (HTTP)", value: -30, type: 'deduction' });
        if (score < 60) scoreFactors.push({ label: "High-risk store metadata", value: -20, type: 'deduction' });
    }

    score = Math.max(0, Math.min(score, 100));

    // VERDICT MAPPING
    let verdict: AnalysisResult['verdict'] = apiData.verdict || 'NEUTRAL';

    // Fallback if API didn't provide verdict
    if (!apiData.verdict) {
        if (score >= 90) verdict = 'LEGIT';
        else if (score >= 80) verdict = 'SECURE';
        else if (score >= 60) verdict = 'NEUTRAL';
        else if (score >= 40) verdict = 'CAUTION';
        else if (score >= 20) verdict = 'RISKY';
        else verdict = 'DANGER';
    }

    // Override for extreme cases
    if (hasRecall) verdict = 'DANGER';

    const riskLevel = apiData.riskLevel || (score < 50 ? 'High Risk' : (score < 75 ? 'Moderate' : 'Safe'));
    const summary = apiData.summary || (hasRecall ? "CRITICAL: Active safety recall detected." : (score >= 80 ? "This target appears highly reliable." : "Caution: Identified potential risk factors."));
    return {
        title: apiData.title || "Analysis Result",
        price: apiData.price,
        image: apiData.image,
        score,
        verdict,
        riskLevel,
        summary,
        fdaStatus: { verified: !hasFDA, details: hasFDA ? "FDA Enforcement Alert" : "No recent FDA actions." },
        recallHistory: { found: hasRecall, details: hasRecall ? "CPSC Recall Found" : "No active recalls." },
        compliance: { ul: false, fcc: false, ce: false, rohs: false },
        proAnalysis: {
            finePrint: apiData.finePrint || [],
            reviewSummary: apiData.reviewSummary || [],
            urgencyScore: apiData.urgencyScore || 0,
            dropshippingScore: apiData.dropshippingScore || 0,
            fullContext: apiData.fullText,
            // NOTE: Mock data for UI demonstration - replace with real sentiment analysis
            keyThemes: [
                { theme: "Build Quality", sentiment: 'positive', count: 124 },
                { theme: "Battery Life", sentiment: 'neutral', count: 85 },
                { theme: "Value for Money", sentiment: 'positive', count: 210 },
                { theme: "Shipping Speed", sentiment: 'negative', count: 42 }
            ]
        },
        sellerReputation: {
            rating: isAmazon ? 4.5 : 3.0,
            details: isAmazon ? "Verified platform seller." : "Independent merchant.",
            // NOTE: Mock data for UI demonstration - replace with real seller data
            accountAge: "4.5 Years",
            location: isAmazon ? "Fulfillment by Amazon" : "United States",
            fulfillmentRate: 98.4
        },
        priceHistory: await fetchPriceHistory(url),
        shippingInfo: apiData.shippingInfo || null,
        checklist: [
            { label: "Safety Audit", status: hasRecall ? "fail" : "pass", reason: hasRecall ? "Recall detected" : "Passed history check" },
            { label: "Store Trust", status: score >= 80 ? "pass" : "warning", reason: score >= 80 ? "Verified reputation" : "Metadata concerns" }
        ],
        similarItems: (apiData.similarItems || []).map((item: any) => ({
            ...item,
            verdict: item.score >= 90 ? 'LEGIT' : (item.score >= 70 ? 'SECURE' : 'CAUTION')
        })),
        scoreFactors
    };
}
