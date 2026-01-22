const fs = require('fs');

async function fetchTarget() {
    const apiKey = '3f2b56d22d0d69d0f1c36a00c1797bcf'; // Using the key from logs
    const url = 'https://www.target.com/s?searchTerm=ipad+air';
    const fetchUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}&render=true`;

    console.log("Fetching: " + fetchUrl);
    try {
        const res = await fetch(fetchUrl);
        const html = await res.text();
        fs.writeFileSync('target_debug.html', html);
        console.log("Dumped HTML to target_debug.html");
    } catch (e) {
        console.error(e);
    }
}

fetchTarget();
