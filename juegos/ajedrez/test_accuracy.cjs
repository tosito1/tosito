const { Chess } = require('chess.js');

const game = new Chess();
game.move('e4');
game.move('e5');
const history = game.history();

const evaluations = [
  { score: 30, isMate: false, bestmove: 'e2e4' },
  { score: -40, isMate: false, bestmove: 'e7e5' },
  { score: 30, isMate: false, bestmove: 'g1f3' }
];

function computeAccuracy(evaluations, history) {
  if (!evaluations || evaluations.length < 2) return [];
  const analysisData = [];
  
  const tempGame = new Chess();
  const verboseHistory = [];
  for (const m of history) {
      verboseHistory.push(tempGame.move(m));
  }

  for (let i = 1; i < evaluations.length; i++) {
    if (!evaluations[i] || !evaluations[i-1]) continue;

    let prevScore = evaluations[i-1].score;
    let currScore = evaluations[i].score;
    if (evaluations[i-1].isMate) prevScore = prevScore > 0 ? 10000 : -10000;
    if (evaluations[i].isMate) currScore = currScore > 0 ? 10000 : -10000;

    const delta = (currScore - prevScore) / 100;
    const isWhite = (i % 2) !== 0; 
    
    const moveDelta = isWhite ? delta : -delta;
    
    let classification = { label: 'Buena', color: '#10b981', icon: '✔️' };
    if (moveDelta >= 0.5) {
        classification = { label: 'Brillante', color: '#2dd4bf', icon: '!!' };
    } else if (moveDelta < -2.0) {
        classification = { label: 'Grave Error', color: '#ef4444', icon: '??' };
    } else if (moveDelta < -0.8) {
        classification = { label: 'Error', color: '#f97316', icon: '?' };
    } else if (moveDelta < -0.2) {
        classification = { label: 'Imprecisión', color: '#eab308', icon: '?!' };
    }

    const moveObj = verboseHistory[i-1];
    analysisData[i] = { 
        label: classification.label, 
        bestmove: evaluations[i-1].bestmove, 
        fromSquare: moveObj ? moveObj.from : null,
        toSquare: moveObj ? moveObj.to : null,
        icon: classification.icon,
        color: classification.color
    };
  }
  return analysisData;
}

console.log(computeAccuracy(evaluations, history));
