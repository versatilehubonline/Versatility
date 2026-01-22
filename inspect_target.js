const fs = require('fs');
const cheerio = require('cheerio');

try {
    const html = fs.readFileSync('target_debug.html', 'utf8');
    const $ = cheerio.load(html);

    console.log("--- Inspecting Target HTML ---");

    // Find the first product card using the data-test attribute we saw
    const card = $('[data-test="product-card"]').first();
    console.log("Card found:", card.length > 0);

    if (card.length > 0) {
        console.log("\nCard Hierarchy:");
        // Print structure of the card
        console.log(card.html().substring(0, 1500));

        console.log("\nTesting Selectors:");
        console.log("Title (data-test):", card.find('[data-test="product-title"]').text());
        console.log("Title (a):", card.find('a').text());
        console.log("Title (aria-label):", card.find('a').attr('aria-label'));
        console.log("Title (img alt):", card.find('img').attr('alt'));
        console.log("Price (data-test):", card.find('[data-test="current-price"]').text());
        // Try to find ANY text inside
        console.log("All Text:", card.text().substring(0, 200));
    } else {
        console.log("No card found with [data-test='product-card']. Searching for common classes...");
        const prices = $('span:contains("$")').slice(0, 3);
        console.log("Found prices:", prices.length);
        prices.each((i, el) => {
            console.log(`Price ${i}:`, $(el).text(), "Parent:", $(el).parent().attr('class'));
        });
    }

} catch (e) {
    console.error(e);
}
