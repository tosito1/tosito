const fs = require('fs');
const html = fs.readFileSync('C:/Users/Tosito/.gemini/antigravity-ide/brain/b24f1ce7-cc22-43c1-b69f-3a3ec78378d1/.system_generated/steps/373/content.md', 'utf8');

const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);

if (nextDataMatch) {
    const data = JSON.parse(nextDataMatch[1]);
    const links = data?.props?.pageProps?.account?.links;
    if (links) {
        console.log('Total links in NEXT_DATA:', links.length);
        links.forEach(l => console.log('- ' + l.title));
    }
} else {
    console.log('No NEXT_DATA. Falling back to regex.');
    const linkRegex = /<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    let match;
    const allLinks = [];
    while ((match = linkRegex.exec(html)) !== null) {
        allLinks.push({ url: match[1], title: match[2].replace(/<[^>]*>/g, '').trim() });
    }
    const filtered = allLinks.filter(l => l.title && l.url.includes('http'));
    console.log('Total links via regex:', filtered.length);
    filtered.forEach(l => console.log('- ' + l.title));
}
