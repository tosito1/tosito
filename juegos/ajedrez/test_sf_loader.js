const https = require('https');
const fs = require('fs');
https.get('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('sf.js', data);
    const { execSync } = require('child_process');
    try {
        const fen = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';
        const script = `
            const STOCKFISH = require('./sf.js');
            const engine = STOCKFISH();
            engine.onmessage = function(msg) {
                console.log('SF:', msg);
                if (msg.includes('bestmove')) process.exit(0);
            };
            engine.postMessage('position fen ' + fen);
            engine.postMessage('go depth 12');
            setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 3000);
        `;
        fs.writeFileSync('test_sf.js', script);
        execSync('node test_sf.js', {stdio: 'inherit'});
    } catch(e) {
        console.log('Failed', e.message);
    }
  });
});
