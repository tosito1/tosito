const fs = require('fs');
const html = fs.readFileSync('C:/Users/Tosito/.gemini/antigravity-ide/brain/b24f1ce7-cc22-43c1-b69f-3a3ec78378d1/.system_generated/steps/373/content.md', 'utf8');

// Linktree injects __NEXT_DATA__
const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);

if (nextDataMatch) {
    const data = JSON.parse(nextDataMatch[1]);
    const links = data?.props?.pageProps?.account?.links;
    if (links) {
        console.log(JSON.stringify(links.map(l => ({ title: l.title, url: l.url })), null, 2));
    } else {
        console.log('No links found in __NEXT_DATA__');
    }
} else {
    // If not NEXT_DATA, let's try finding link elements
    const linkRegex = /<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    let match;
    const allLinks = [];
    while ((match = linkRegex.exec(html)) !== null) {
        allLinks.push({ url: match[1], title: match[2].replace(/<[^>]*>/g, '').trim() });
    }
    console.log(JSON.stringify(allLinks.filter(l => l.title), null, 2));
}
