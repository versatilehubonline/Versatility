
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Safety Check Helpers (Moved to Server)
const CPSC_URL = "https://www.saferproducts.gov/RestWebServices/Recall";
const FDA_URL = "https://api.fda.gov";

async function fetchCPSC(keyword: string) {
    try {
        const res = await fetch(`${CPSC_URL}?format=json&RecallTitle=${encodeURIComponent(keyword)}`);
        return res.ok ? await res.json() : [];
    } catch { return []; }
}

async function fetchFDA(keyword: string) {
    const endpoints = [`${FDA_URL}/drug/enforcement.json`, `${FDA_URL}/device/enforcement.json`, `${FDA_URL}/food/enforcement.json`];
    try {
        const promises = endpoints.map(e => fetch(`${e}?search=product_description:"${encodeURIComponent(keyword)}"&limit=1`).then(r => r.ok ? r.json() : null).catch(() => null));
        const res = await Promise.all(promises);
        return res.filter(d => d && d.results).flatMap((d: any) => d.results);
    } catch { return []; }
}

// Patterns
const URGENCY_PATTERNS = [/only \d+ left/i, /limited time/i, /flash sale/i, /hurry/i, /ending soon/i, /\d+ people are viewing/i, /fomo/i, /almost gone/i];
const DROPSHIPPING_PATTERNS = [/epacket/i, /shipping calculated at checkout/i, /please allow \d+-\d+ weeks/i, /ships from china/i, /aliexpress/i, /Oberlo/i, /direct from factory/i];
const SENTIMENT_POSITIVE = [/excellent/i, /high quality/i, /fast shipping/i, /great customer service/i, /highly recommend/i, /authentic/i, /original/i];
const SENTIMENT_NEGATIVE = [/scam/i, /fake/i, /late delivery/i, /never arrived/i, /bad quality/i, /terrible support/i, /overpriced/i, /not as described/i];
const LEGAL_KEYWORDS = ["privacy policy", "terms of use", "refund policy", "contact us", "about us"];

const SELECTORS = {
    amazon: { title: "#productTitle", image: "#landingImage, #imgTagWrapperId img", price: ".a-price .a-offscreen, #price_inside_buybox" },
    shopify: { title: ".product-single__title, .product-title, h1", image: "[data-product-single-thumbnail], .product__main-photos img, .product-image", price: ".product__price, .price, .product-price" },
    target: { title: "[data-test='product-title']", image: "[data-test='product-image'] img", price: "[data-test='product-price']" },
    walmart: { title: "h1", image: "[data-testid='hero-image-container'] img", price: "[itemprop='price']" },
    generic: { title: "h1, .product-title, .title", image: "meta[property='og:image']", price: ".price, .product-price, span:contains('$')" }
};

function extractJSONLD($: any, type: string): any {
    let result: any = null;
    $('script[type="application/ld+json"]').each((_: any, el: any) => {
        try {
            const data = JSON.parse($(el).html() || '{}');
            if (Array.isArray(data)) {
                const item = data.find((i: any) => i['@type'] === type || i['@type']?.includes(type));
                if (item) result = item;
            } else if (data['@type'] === type || data['@type']?.includes(type)) {
                result = data;
            }
            if (!result && data['@graph']) {
                const item = data['@graph'].find((i: any) => i['@type'] === type || i['@type']?.includes(type));
                if (item) result = item;
            }
        } catch (e) { }
    });
    return result;
}

function cleanText(text: string): string { return text.replace(/\s+/g, ' ').trim(); }

function extractSearchTerm(url: string, title?: string): string {
    if (title && title.length > 5) {
        const cleaned = title.replace(/Amazon\.com[:\-] /i, '').replace(/\|.*/, '').trim();
        return cleaned.split(' ').slice(0, 6).join(' ');
    }
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname.split('/').filter(Boolean);
        const slug = path[path.length - 1];
        if (slug && !slug.includes('.html')) {
            return slug.replace(/-/g, ' ').replace(/_/g, ' ');
        }
        return urlObj.hostname.replace('www.', '').split('.')[0];
    } catch { return "Product"; }
}

export async function POST(req: NextRequest) {
    try {
        const { url, mode = 'product', searchQuery } = await req.json();

        // Allow pure search without URL
        if (!url && !searchQuery) return NextResponse.json({ error: "Missing URL or Search Query" }, { status: 400 });

        const isWebsiteMode = mode === 'website';
        let html = "";
        let title = "Unknown Target";
        let mainImage = null;
        let price = null;
        let fullBodyText = "";
        let finePrint: string[] = [];
        let reviewSummary: string[] = [];
        let detectedTriggers: string[] = [];
        let platform = "Direct Site";
        let shippingInfo: string | null = null;

        try {
            // Use ScraperAPI if available and valid, otherwise direct fetch
            const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
            const IS_PLACEHOLDER = SCRAPER_API_KEY === "2a24bf4da4355a5444b55f04943a5abc";

            if (IS_PLACEHOLDER) {
                console.warn("⚠️ WARNING: ScraperAPI key is set to the placeholder value.");
            }

            const fetchUrl = (SCRAPER_API_KEY && !IS_PLACEHOLDER)
                ? `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`
                : url;

            const response = await fetch(fetchUrl, {
                headers: { "User-Agent": "Mozilla/5.0" },
                next: { revalidate: 3600 }
            });

            if (response.ok) {
                html = await response.text();
                const $ = cheerio.load(html);
                $('script:not([type="application/ld+json"]), style, iframe, noscript').remove();

                const isAmazon = url.includes("amazon.com");
                const isShopify = html.includes("Shopify.theme") || html.includes("cdn.shopify.com");
                const isTarget = url.includes("target.com");
                const isWalmart = url.includes("walmart.com");

                platform = isAmazon ? "Amazon" : (isShopify ? "Shopify" : (isTarget ? "Target" : (isWalmart ? "Walmart" : "Direct Site")));

                // Selectors Fallback
                // @ts-ignore
                const sel = SELECTORS[platform.toLowerCase()] || SELECTORS.generic;

                // 1. JSON-LD Strategy (Most Reliable)
                const jsonLd = extractJSONLD($, 'Product');
                if (jsonLd) {
                    title = cleanText(jsonLd.name || "");
                    mainImage = jsonLd.image ? (Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image) : null;
                    const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
                    if (offer) {
                        let p = offer.price || offer.highPrice || offer.lowPrice;
                        if (p) {
                            if (!p.toString().includes('$') && (offer.priceCurrency === 'USD' || !offer.priceCurrency)) p = `$${p}`;
                            price = p.toString();
                        }
                    }
                }

                // 2. Meta Tag Strategy (Reliable)
                if (!title || title === "Unknown Target") title = $('meta[property="og:title"]').attr("content") || $('meta[name="twitter:title"]').attr("content") || "";
                if (!mainImage) mainImage = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content");
                if (!price) price = $('meta[property="og:price:amount"]').attr("content") ? `$${$('meta[property="og:price:amount"]').attr("content")}` : null;
                if (!price) price = $('meta[name="twitter:data1"]').attr("content") || null; // Often used for price

                // 3. CSS Selector Strategy (Fallback)
                if (!title || title === "Unknown Target") title = cleanText($(sel.title).first().text() || $('title').text());
                if (!mainImage) mainImage = $(sel.image).attr("src");
                if (!price) price = cleanText($(sel.price).first().text() || "Varies");
                fullBodyText = cleanText($('body').text());

                // Extract shipping information
                if (isAmazon) {
                    const shippingSelectors = ["#deliveryBlockMessage", "#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE", "[data-csa-c-delivery-price]", "#fast-track-message"];
                    for (const selector of shippingSelectors) {
                        const text = $(selector).first().text().trim();
                        if (text && (text.includes("FREE") || text.includes("delivery") || text.includes("shipping"))) {
                            shippingInfo = cleanText(text);
                            break;
                        }
                    }
                    if (!shippingInfo && $("[aria-label*='Prime']").length > 0) shippingInfo = "FREE Prime shipping available";
                } else if (url.includes("ebay.com")) {
                    const shippingText = $(".ux-labels-values--shipping .ux-textspans").first().text().trim();
                    if (shippingText) shippingInfo = cleanText(shippingText);
                } else if (url.includes("walmart.com")) {
                    const shippingText = $("[data-testid='fulfillment-shipping']").first().text().trim();
                    if (shippingText) shippingInfo = cleanText(shippingText);
                } else {
                    const match = fullBodyText.match(/free shipping|shipping: \$[\d.]+/i);
                    if (match) shippingInfo = match[0];
                }

                const posCount = SENTIMENT_POSITIVE.filter(p => p.test(fullBodyText)).length;
                const negCount = SENTIMENT_NEGATIVE.filter(n => n.test(fullBodyText)).length;
                if (negCount > posCount) {
                    reviewSummary.push("Warning: Surface sentiment reveals multiple quality complaints.");
                } else if (posCount > 2) {
                    reviewSummary.push("General sentiment appears positive.");
                } else {
                    reviewSummary.push("Neutral sentiment detected.");
                }

                if (fullBodyText.includes("restocking fee")) finePrint.push("Caution: Re-stocking fee.");
                if (fullBodyText.includes("no refunds")) finePrint.push("Warning: No Refunds.");
            }
        } catch (e) {
            console.error("Scraper Error:", e);
        }

        const searchTerm = searchQuery || extractSearchTerm(url, title);
        console.log(`[Analyzer] Using Search Term: "${searchTerm}"`);

        const [cpsc, fda] = await Promise.all([fetchCPSC(searchTerm), fetchFDA(searchTerm)]);

        let urgencyScore = 0;
        let dropshippingScore = 0;
        let trustScore = 80;

        URGENCY_PATTERNS.forEach(p => { if (p.test(fullBodyText)) urgencyScore += 15; });
        DROPSHIPPING_PATTERNS.forEach(p => { if (p.test(fullBodyText)) dropshippingScore += 25; });

        const SR_API_KEY = process.env.SCRAPER_API_KEY;
        const SR_IS_PLACEHOLDER = SR_API_KEY === "2a24bf4da4355a5444b55f04943a5abc";

        const searchPromises = [

            // Amazon Search (ENABLED)
            (async () => {
                try {
                    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}`;
                    const fetchUrl = SR_API_KEY && !SR_IS_PLACEHOLDER
                        ? `https://api.scraperapi.com?api_key=${SR_API_KEY}&url=${encodeURIComponent(searchUrl)}`
                        : searchUrl;

                    const res = await fetch(fetchUrl);
                    if (!res.ok) throw new Error("Amazon fetch failed");
                    const html = await res.text();
                    const $ = cheerio.load(html);

                    const items: any[] = [];
                    // Updated Selectors for Amazon
                    $('.s-result-item[data-component-type="s-search-result"]').slice(0, 10).each((_, el) => {
                        const item = $(el);
                        const title = item.find('h2 a span').text().trim() || item.find('h2').text().trim();
                        const price = item.find('.a-price .a-offscreen').first().text().trim();
                        const linkPart = item.find('a.a-link-normal.s-no-outline').attr('href') || item.find('a.a-link-normal').attr('href');
                        const link = linkPart ? (linkPart.startsWith('http') ? linkPart : "https://www.amazon.com" + linkPart) : null;
                        const image = item.find('img.s-image').attr('src');

                        if (title && link) {
                            items.push({ title, url: link, score: 98, verdict: "SECURE", source: "Amazon", price: price || "Check Price", shipping: "Free Prime", condition: "New", image });
                        }
                    });
                    if (items.length > 0) return items;
                } catch (e) { console.error("Amazon Error", e); }
                return [];
            })(),

            // Target Search (VIA JINA AI - HYPERSCALE PARSING)
            (async () => {
                try {
                    const searchUrl = `https://www.target.com/s?searchTerm=${encodeURIComponent(searchTerm)}`;
                    // Jina AI URL
                    const jinaUrl = `https://r.jina.ai/${searchUrl}`;

                    require('fs').appendFileSync('scraper_debug.log', `[Target-Jina] Fetching: ${jinaUrl}\n`);

                    // We use standard fetch here. Jina handles the complexity.
                    const res = await fetch(jinaUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });

                    if (!res.ok) throw new Error(`Jina fetch failed: ${res.status}`);
                    const markdown = await res.text();
                    require('fs').appendFileSync('scraper_debug.log', `[Target-Jina] Received ${markdown.length} bytes. Content: ${markdown.substring(0, 500)}\n`);

                    const items: any[] = [];

                    const lines = markdown.split('\n');
                    const seenUrls = new Set();

                    for (const line of lines) {
                        if (items.length >= 8) break;

                        // Heuristic: Line must have a link, a price, and look like a product list item
                        if (line.includes('](') && (line.includes('$') || line.match(/\d+\.\d{2}/))) {

                            // Extract Price
                            const priceMatch = line.match(/\$[\d,]+(?:\.\d{2})?/);
                            const price = priceMatch ? priceMatch[0] : null;

                            // Extract URL (last link is usually the product title link in the line)
                            // Format often: ... [Title](https://...) ...
                            const linkMatches = [...line.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)];

                            if (price && linkMatches.length > 0) {
                                // Prefer the link that looks like a product link (/p/)
                                let title = linkMatches[linkMatches.length - 1][1];
                                let url = linkMatches[linkMatches.length - 1][2];
                                let image = null;

                                // Try to find specific /p/ link details if multiple
                                const pLink = linkMatches.find(m => m[2] && m[2].includes('/p/'));
                                if (pLink) {
                                    title = pLink[1];
                                    url = pLink[2];
                                }

                                // Look for image in the earlier matches
                                const imgMatch = linkMatches.find(m => m[1] && (m[1].includes('Image') || (m[2] && (m[2].includes('scene7') || m[2].includes('targetimg')))));
                                if (imgMatch) {
                                    // Jina puts image like ![Alt](src) where src is the link
                                    image = imgMatch[2];
                                }

                                // Clean Title
                                title = title.replace(/^Image \d+: /, '').replace(/ - Target$/, '').trim();
                                if (title.startsWith("![") || title.startsWith("###")) continue;

                                if (url.includes('target.com') && !seenUrls.has(url)) {
                                    seenUrls.add(url);
                                    items.push({
                                        title,
                                        url,
                                        score: 90,
                                        verdict: "SECURE",
                                        source: "Target",
                                        price,
                                        shipping: "Fast Shipping",
                                        condition: "New",
                                        image
                                    });
                                }
                            }
                        }
                    }

                    if (items.length > 0) {
                        require('fs').appendFileSync('scraper_debug.log', `[Target-Jina] Extracted ${items.length} items successfully via Jina.\n`);
                        return items;
                    }
                } catch (e) { console.error("Target (Jina) Error", e); }
                return [];
            })(),

            // eBay Search
            (async () => {
                try {
                    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerm)}&_sop=12`;
                    const fetchUrl = SR_API_KEY && !SR_IS_PLACEHOLDER
                        ? `https://api.scraperapi.com?api_key=${SR_API_KEY}&url=${encodeURIComponent(searchUrl)}&render=true&country_code=us`
                        : searchUrl;

                    require('fs').appendFileSync('scraper_debug.log', `[eBay] Fetching: ${fetchUrl}\n`);

                    const res = await fetch(fetchUrl);
                    if (!res.ok) throw new Error(`eBay fetch failed status: ${res.status}`);
                    const html = await res.text();
                    const $ = cheerio.load(html);

                    const items: any[] = [];
                    let ebayItems = $('.s-item__wrapper, .s-item, .s-card').slice(1, 11);

                    require('fs').appendFileSync('scraper_debug.log', `[eBay] Found ${ebayItems.length} items (mixed selectors).\n`);

                    if (ebayItems.length === 0) {
                        require('fs').writeFileSync('ebay_debug.html', html);
                        require('fs').appendFileSync('scraper_debug.log', `[eBay] Dumped HTML to ebay_debug.html\n`);
                    }

                    ebayItems.each((_, el) => {
                        const item = $(el);
                        let title = item.find('.s-item__title').text().trim() || item.find('.s-card__title').text().trim();
                        // Clean up title (remove "Opens in a new window or tab")
                        title = title.replace(/Opens in a new window or tab/gi, '').trim();

                        const price = item.find('.s-item__price').text().trim() || item.find('.s-card__price').text().trim();
                        let link = item.find('a.s-item__link').attr('href') || item.find('a.s-card__link').attr('href');
                        const image = item.find('.s-item__image-img').attr('src') || item.find('.s-card__image').attr('src');

                        if (title && link && !title.includes("Shop on eBay")) {
                            items.push({ title, url: link, score: 88, verdict: "SECURE", source: "eBay", price: price || "Check Price", shipping: "Free Shipping", condition: "New", image });
                        }
                    });

                    if (items.length > 0) return items;
                } catch (e) {
                    console.error("eBay Error", e);
                }
                return [];
            })(),

            // Walmart Search (VIA JINA AI)
            (async () => {
                try {
                    const searchUrl = `https://www.walmart.com/search?q=${encodeURIComponent(searchTerm)}`;
                    const jinaUrl = `https://r.jina.ai/${searchUrl}`;

                    require('fs').appendFileSync('scraper_debug.log', `[Walmart-Jina] Fetching: ${jinaUrl}\n`);

                    const res = await fetch(jinaUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });

                    if (!res.ok) throw new Error(`Jina fetch failed: ${res.status}`);
                    const markdown = await res.text();
                    require('fs').appendFileSync('scraper_debug.log', `[Walmart-Jina] Received ${markdown.length} bytes.\n`);

                    const items: any[] = [];
                    const lines = markdown.split('\n');
                    const seenUrls = new Set();

                    for (const line of lines) {
                        if (items.length >= 8) break;
                        if (line.includes('](') && (line.includes('$') || line.match(/\d+\.\d{2}/))) {
                            const priceMatch = line.match(/\$[\d,]+(?:\.\d{2})?/);
                            const price = priceMatch ? priceMatch[0] : null;
                            const linkMatches = [...line.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)];

                            if (price && linkMatches.length > 0) {
                                // Walmart links usually contain /ip/
                                let title = linkMatches[linkMatches.length - 1][1];
                                let url = linkMatches[linkMatches.length - 1][2];
                                let image = null;

                                const pLink = linkMatches.find(m => m[2] && m[2].includes('/ip/'));
                                if (pLink) {
                                    title = pLink[1];
                                    url = pLink[2];
                                }

                                const imgMatch = linkMatches.find(m => m[1] && m[1].includes('Image'));
                                if (imgMatch) image = imgMatch[2];

                                // Clean title (remove ###, price, status words)
                                title = title
                                    .replace(/^###\s*/, '') // Remove markdown header
                                    .replace(/^(Best seller|Rollback|Reduced price|Clearance|Flash Deal)\s*/i, '') // Remove status
                                    .replace(/^In \d+\+ people's carts\s*/i, '')
                                    .replace(/Image \d+: /, '')
                                    .replace(/ - Walmart\.com$/, '')
                                    .replace(/\$\d{1,5}(?:\.\d{2})?(\s*Was\s*\$[\d,.]+)?/g, '') // Remove prices from title
                                    .trim();

                                if (title.startsWith("![") || title.length < 3) continue;

                                if (url.includes('walmart.com') && !seenUrls.has(url)) {
                                    seenUrls.add(url);
                                    items.push({
                                        title,
                                        url,
                                        score: 90,
                                        verdict: "SECURE",
                                        source: "Walmart",
                                        price,
                                        shipping: "Fast Shipping",
                                        condition: "New",
                                        image
                                    });
                                }
                            }
                        }
                    }

                    if (items.length > 0) {
                        require('fs').appendFileSync('scraper_debug.log', `[Walmart-Jina] Extracted ${items.length} items successfully.\n`);
                        return items;
                    }
                } catch (e: any) {
                    console.error("Walmart (Jina) Error", e);
                    require('fs').appendFileSync('scraper_debug.log', `[Walmart-Jina] Error: ${e.message}\n`);
                }
                return [];
            })(),


        ];

        // ADDING NEW INTEGRATIONS (Nike, Adidas, Apple, Microsoft)
        const newIntegrations = [
            // Nike Search (VIA JINA AI)
            (async () => {
                try {
                    const searchUrl = `https://www.nike.com/w?q=${encodeURIComponent(searchTerm)}`;
                    const jinaUrl = `https://r.jina.ai/${searchUrl}`;
                    require('fs').appendFileSync('scraper_debug.log', `[Nike-Jina] Fetching: ${jinaUrl}\n`);

                    const res = await fetch(jinaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    if (!res.ok) throw new Error(`Jina fetch failed: ${res.status}`);

                    const markdown = await res.text();
                    const items: any[] = [];
                    const lines = markdown.split('\n');
                    const seenUrls = new Set();

                    for (const line of lines) {
                        if (items.length >= 6) break;
                        // Nike Pattern: [Title](link) ... $Price
                        if (line.includes('](') && (line.includes('$') || line.match(/\d+\.\d{2}/))) {
                            const priceMatch = line.match(/\$[\d,]+(?:\.\d{2})?/);
                            const price = priceMatch ? priceMatch[0] : null;
                            const linkMatches = [...line.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)];

                            if (price && linkMatches.length > 0) {
                                // Nike links often contain /t/ or /launch/
                                let title = linkMatches[0][1];
                                let url = linkMatches[0][2];

                                // Specific cleanup for Nike
                                title = title.replace(/Nike|Jordan|Air Max/gi, (m) => m).trim();

                                if (url.includes('nike.com') && !seenUrls.has(url)) {
                                    seenUrls.add(url);
                                    items.push({
                                        title: title.length > 50 ? title.substring(0, 50) + "..." : title,
                                        url,
                                        score: 96,
                                        verdict: "LEGIT",
                                        source: "Nike",
                                        price,
                                        shipping: "Free Members Shipping",
                                        condition: "New",
                                        image: null
                                    });
                                }
                            }
                        }
                    }
                    if (items.length > 0) return items;
                } catch (e) { console.error("Nike Error", e); }
                return [];
            })(),

            // Adidas Search (VIA JINA AI)
            (async () => {
                try {
                    const searchUrl = `https://www.adidas.com/us/search?q=${encodeURIComponent(searchTerm)}`;
                    const jinaUrl = `https://r.jina.ai/${searchUrl}`;

                    const res = await fetch(jinaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    if (!res.ok) throw new Error(`Jina fetch failed: ${res.status}`);

                    const markdown = await res.text();
                    const items: any[] = [];
                    const lines = markdown.split('\n');
                    const seenUrls = new Set();

                    for (const line of lines) {
                        if (items.length >= 6) break;
                        if (line.includes('](') && (line.includes('$') || line.match(/\d+\.\d{2}/))) {
                            const priceMatch = line.match(/\$[\d,]+(?:\.\d{2})?/);
                            const price = priceMatch ? priceMatch[0] : null;
                            const linkMatches = [...line.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)];

                            if (price && linkMatches.length > 0) {
                                let title = linkMatches[0][1];
                                let url = linkMatches[0][2];

                                if (url.includes('adidas.com') && !seenUrls.has(url)) {
                                    seenUrls.add(url);
                                    items.push({
                                        title: title.length > 50 ? title.substring(0, 50) + "..." : title,
                                        url,
                                        score: 95,
                                        verdict: "LEGIT",
                                        source: "Adidas",
                                        price,
                                        shipping: "Free Shipping",
                                        condition: "New",
                                        image: null
                                    });
                                }
                            }
                        }
                    }
                    if (items.length > 0) return items;
                } catch (e) { console.error("Adidas Error", e); }
                return [];
            })(),

            // Apple Search (VIA JINA AI)
            (async () => {
                try {
                    const searchUrl = `https://www.apple.com/us/search/${encodeURIComponent(searchTerm)}?src=globalnav`;
                    const jinaUrl = `https://r.jina.ai/${searchUrl}`;
                    require('fs').appendFileSync('scraper_debug.log', `[Apple-Jina] Fetching: ${jinaUrl}\n`);

                    const res = await fetch(jinaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    if (!res.ok) throw new Error(`Jina fetch failed: ${res.status}`);

                    const markdown = await res.text();
                    const items: any[] = [];
                    const lines = markdown.split('\n');
                    const seenUrls = new Set();

                    // Apple's Jina output often has headers like "Title \n ---- \n Description \n [Link](url)"
                    // Or standard [Title](url) in lists.
                    for (let i = 0; i < lines.length; i++) {
                        if (items.length >= 4) break;
                        const line = lines[i];

                        // Strategy 1: Standard Link Match
                        const linkMatches = [...line.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)];

                        // Strategy 2: Look for titles followed by links nearby (heuristic)
                        // If line looks like a title (underlined with dashes in next line)
                        // Jina often uses H2 (---) for titles
                        if (i < lines.length - 2 && lines[i + 1].trim().startsWith('---')) {
                            // "Title \n ---" detected. Look ahead for link.
                            let title = line.trim();
                            // Search next 5 lines for a product link
                            for (let j = 1; j <= 5; j++) {
                                if (i + j >= lines.length) break;
                                const subLine = lines[i + j];
                                const subMatches = [...subLine.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)];
                                if (subMatches.length > 0) {
                                    // Found a link for this header
                                    const url = subMatches[0][2];
                                    if (isValidAppleProductUrl(url) && !seenUrls.has(url)) {
                                        seenUrls.add(url);
                                        items.push(createAppleItem(title, url));
                                        i += j; // Skip ahead
                                    }
                                    break; // Only take first link for title
                                }
                            }
                        } else if (linkMatches.length > 0) {
                            // Fallback to standard line processing
                            const url = linkMatches[0][2];
                            const title = linkMatches[0][1];
                            if (isValidAppleProductUrl(url) && !seenUrls.has(url)) {
                                seenUrls.add(url);
                                items.push(createAppleItem(title, url));
                            }
                        }
                    }

                    function isValidAppleProductUrl(url: string) {
                        return url.includes('apple.com') &&
                            !url.includes('support.apple.com') &&
                            !url.includes('legal') &&
                            !url.includes('jobs') &&
                            !url.includes('newsroom') &&
                            !url.includes('search') &&
                            (url.includes('/shop/') || url.includes('/buy-') || url.includes('/iphone') || url.includes('/mac') || url.includes('/ipad') || url.includes('/watch') || url.includes('/airpods'));
                    }

                    function createAppleItem(title: string, url: string) {
                        // Clean title
                        title = title.replace(/- Apple$/, '').replace(/^Buy\s+/, '').trim();
                        // Guess price context or default
                        return {
                            title: title.length > 50 ? title.substring(0, 50) + "..." : title,
                            url,
                            score: 99,
                            verdict: "LEGIT",
                            source: "Apple",
                            price: "Official Store",
                            shipping: "Free",
                            condition: "New",
                            image: null
                        };
                    }

                    if (items.length > 0) return items;
                } catch (e) { console.error("Apple Error", e); }
                return [];
            })(),

            // Microsoft Search (VIA JINA AI)
            (async () => {
                try {
                    const searchUrl = `https://www.microsoft.com/en-us/search/explore?q=${encodeURIComponent(searchTerm)}`;
                    const jinaUrl = `https://r.jina.ai/${searchUrl}`;
                    require('fs').appendFileSync('scraper_debug.log', `[Microsoft-Jina] Fetching: ${jinaUrl}\n`);

                    const res = await fetch(jinaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    if (!res.ok) throw new Error(`Jina fetch failed: ${res.status}`);

                    const markdown = await res.text();
                    const items: any[] = [];
                    const lines = markdown.split('\n');
                    const seenUrls = new Set();

                    for (const line of lines) {
                        if (items.length >= 6) break;

                        // Microsoft Logic: Relaxed, no price needed
                        // Find any markdown link
                        const linkMatches = [...line.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)];

                        if (linkMatches.length > 0) {
                            let title = linkMatches[0][1];
                            let url = linkMatches[0][2];

                            // Check if it's a product link (surface, xbox, etc) or store link
                            // We accept most microsoft.com links that aren't pure navigation if possible, 
                            // but ensuring 'surface', 'xbox', 'store' or 'd/ (device)' helps quality.
                            const isProduct = url.includes('/surface') || url.includes('/xbox') || url.includes('/store') || url.includes('/d/');

                            if (url.includes('microsoft.com') && isProduct && !seenUrls.has(url)) {
                                seenUrls.add(url);
                                // Attempt to find price in line if it exists
                                const priceMatch = line.match(/\$[\d,]+(?:\.\d{2})?/);
                                const price = priceMatch ? priceMatch[0] : "Official Store";

                                items.push({
                                    title: title.length > 50 ? title.substring(0, 50) + "..." : title,
                                    url,
                                    score: 97,
                                    verdict: "LEGIT",
                                    source: "Microsoft",
                                    price,
                                    shipping: "Free",
                                    condition: "New",
                                    image: null
                                });
                            }
                        }
                    }
                    if (items.length > 0) return items;
                } catch (e) { console.error("Microsoft Error", e); }
                return [];
            })()
        ];

        // Push new integrations to main search promises
        searchPromises.push(...newIntegrations);

        const rawResults = await Promise.all(searchPromises);

        const marketResults = rawResults.flat().filter(Boolean) as any[];

        // Fill similarItems
        const similarItems = marketResults;

        // ... scoring logic ...
        let verdict = "NEUTRAL";
        if (dropshippingScore > 80 || trustScore < 40) verdict = "DANGER";
        else if (dropshippingScore > 50 || urgencyScore > 70 || trustScore < 60) verdict = "CAUTION";
        else if (trustScore >= 85) verdict = "LEGIT";
        else if (trustScore >= 70) verdict = "SECURE";

        return NextResponse.json({
            title, image: mainImage, price, urgencyScore, dropshippingScore, trustScore,
            detectedTriggers, finePrint, reviewSummary, fullText: fullBodyText.slice(0, 3000),
            similarItems, platform, shippingInfo, verdict,
            riskLevel: ["LEGIT", "SECURE"].includes(verdict) ? "Safe" : (verdict === "DANGER" ? "High Risk" : "Moderate"),
            summary: reviewSummary.join(" ") || "No significant reviews found.",
            score: trustScore, scoreFactors: [], recallHistory: { found: cpsc.length > 0, details: cpsc.length > 0 ? "Recalls" : "None" },
            safety: { cpsc: cpsc[0], fda: fda[0], reports: fda }
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
