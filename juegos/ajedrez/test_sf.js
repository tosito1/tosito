
            const STOCKFISH = require('./sf.js');
            const engine = STOCKFISH();
            engine.onmessage = function(msg) {
                console.log('SF:', msg);
                if (msg.includes('bestmove')) process.exit(0);
            };
            engine.postMessage('position fen ' + fen);
            engine.postMessage('go depth 12');
            setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 3000);
        