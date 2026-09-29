const fs = require('fs');
const path = require('path');

const scrapedPath = path.join(__dirname, 'src', 'scraped_data.json');
const localLinksPath = path.join(__dirname, 'src', 'local_links.json');

// Clear scraped_data.json
fs.writeFileSync(scrapedPath, JSON.stringify([], null, 2));
console.log('✅ src/scraped_data.json vaciado.');

// Clear local_links.json
const emptyLinks = {
  movies: {},
  series: {}
};
fs.writeFileSync(localLinksPath, JSON.stringify(emptyLinks, null, 2));
console.log('✅ src/local_links.json vaciado.');

process.exit(0);
