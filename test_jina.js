async function testJina() {
    const targetUrl = 'https://www.target.com/s?searchTerm=ipad+air';
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;

    console.log(`Fetching from Jina: ${jinaUrl}`);
    try {
        const res = await fetch(jinaUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!res.ok) throw new Error(`Jina failed: ${res.status}`);
        const markdown = await res.text();

        console.log("\n--- Jina Markdown Dump (First 1000 chars) ---");
        console.log(markdown.substring(0, 1000));

        console.log("\n--- Extraction Test ---");
        // Look for common markdown product patterns (e.g. "Title - $Price" or links)
        const lines = markdown.split('\n');
        let found = 0;
        lines.forEach(line => {
            if (found > 5) return;
            // Simple heuristic: Line contains a link and a dollar sign
            if (line.includes('](') && line.includes('$')) {
                console.log("Possible Item:", line.trim());
                found++;
            }
        });

    } catch (e) {
        console.error(e);
    }
}

testJina();
