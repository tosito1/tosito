const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Tosito/Desktop/Tosito/spotitoust/src/App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const normalizedContent = content.replace(/\r\n/g, '\n');
const approxIndex = normalizedContent.indexOf('Spotify Client Secret Personal');
if (approxIndex !== -1) {
  console.log("Context after 'Spotify Client Secret Personal':");
  console.log(normalizedContent.substring(approxIndex, approxIndex + 1000));
} else {
  console.log("Could not find 'Spotify Client Secret Personal' in file.");
}
