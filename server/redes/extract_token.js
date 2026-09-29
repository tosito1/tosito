const fs = require('fs');
const html = fs.readFileSync('router_home.html', 'utf8');
const match = html.match(/var\s+_sessionTmpToken\s*=\s*"([^"]+)"/);
console.log("Token in html:", match ? match[1] : 'not found');
