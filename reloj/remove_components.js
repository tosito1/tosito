const fs = require('fs');
let js = fs.readFileSync('public/app.js', 'utf8');
const startIdx = js.indexOf('    {\n        id: "mod-timegrapher"');
if (startIdx > -1) {
    const prevComma = js.lastIndexOf(',', startIdx);
    const endIdx = js.indexOf('];', startIdx);
    if (prevComma > -1 && endIdx > -1) {
        js = js.substring(0, prevComma) + '\n' + js.substring(endIdx);
        fs.writeFileSync('public/app.js', js);
        console.log('Removed components from app.js');
    } else {
        console.log('Could not find bounds');
    }
} else {
    console.log('Could not find start index');
}
