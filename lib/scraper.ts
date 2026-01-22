import * as cheerio from "cheerio";

export async function fetchCurrentPrice(url: string): Promise<number | null> {
    try {
        // Use ScraperAPI if available, otherwise direct fetch
        const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
        const fetchUrl = SCRAPER_API_KEY
            ? `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`
            : url;

        const response = await fetch(fetchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        let currentPrice: number | null = null;

        // Amazon price extraction
        if (url.includes("amazon.com")) {
            const selectors = [
                ".a-price .a-offscreen",
                "#priceblock_ourprice",
                "#priceblock_dealprice",
                ".a-price-whole",
                "#corePrice_feature_div .a-price .a-offscreen",
                "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
                ".priceToPay .a-offscreen",
                "#apex_desktop .a-price .a-offscreen"
            ];

            for (const selector of selectors) {
                const priceText = $(selector).first().text().trim();
                if (priceText) {
                    const cleaned = priceText.replace(/[^0-9.]/g, "");
                    if (cleaned && !isNaN(parseFloat(cleaned))) {
                        currentPrice = parseFloat(cleaned);
                        break;
                    }
                }
            }

            // Fallback: structured data
            if (!currentPrice) {
                const scripts = $('script[type="application/ld+json"]');
                scripts.each((_, elem) => {
                    try {
                        const data = JSON.parse($(elem).html() || "");
                        if (data.offers?.price) currentPrice = parseFloat(data.offers.price);
                        else if (data.offers?.lowPrice) currentPrice = parseFloat(data.offers.lowPrice);
                    } catch (e) { /* skip */ }
                });
            }
        }

        // eBay
        else if (url.includes("ebay.com")) {
            const selectors = [".x-price-primary .ux-textspans", ".x-bin-price__content .ux-textspans", ".mainPrice", "[itemprop='price']"];
            for (const selector of selectors) {
                const priceText = $(selector).first().text().trim().replace(/[^0-9.]/g, "");
                if (priceText && !isNaN(parseFloat(priceText))) {
                    currentPrice = parseFloat(priceText);
                    break;
                }
            }
        }

        // Walmart
        else if (url.includes("walmart.com")) {
            const selectors = ["[itemprop='price']", ".price-characteristic", "[data-testid='price-wrap'] span"];
            for (const selector of selectors) {
                const priceText = $(selector).first().text().trim().replace(/[^0-9.]/g, "");
                if (priceText && !isNaN(parseFloat(priceText))) {
                    currentPrice = parseFloat(priceText);
                    break;
                }
            }
        }

        // Generic / Other
        else {
            const ogPrice = $('meta[property="product:price:amount"]').attr("content");
            if (ogPrice && !isNaN(parseFloat(ogPrice))) currentPrice = parseFloat(ogPrice);

            if (!currentPrice) {
                const scripts = $('script[type="application/ld+json"]');
                scripts.each((_, elem) => {
                    try {
                        const data = JSON.parse($(elem).html() || "");
                        if (data.offers?.price) currentPrice = parseFloat(data.offers.price);
                        else if (data.offers?.lowPrice) currentPrice = parseFloat(data.offers.lowPrice);
                    } catch (e) { /* skip */ }
                });
            }

            if (!currentPrice) {
                const selectors = ['[itemprop="price"]', '.price', '[class*="price"]'];
                for (const selector of selectors) {
                    const text = $(selector).first().text().trim();
                    const match = text.match(/\$?\s*(\d+\.?\d*)/);
                    if (match && parseFloat(match[1]) > 0) {
                        currentPrice = parseFloat(match[1]);
                        break;
                    }
                }
            }
        }

        return currentPrice;

    } catch (error) {
        console.error("Scraper Error:", error);
        return null;
    }
}
