export class GameAnalyzer {
    constructor(workerUrl, depth = 12) {
        this.depth = depth;
        this.worker = new Worker(workerUrl);
        this.isAnalyzing = false;
        this.currentResolve = null;
        this.evaluations = [];
        this.currentFenIndex = 0;
        this.fens = [];
        this.onProgress = null;

        this.worker.onmessage = (event) => this.handleWorkerMessage(event);
    }

    handleWorkerMessage(event) {
        const line = event.data;
        // Buscamos líneas con "info depth" y "score" para ir actualizando el mejor score encontrado
        if (line.includes('info depth') && line.includes('score')) {
            let score = 0;
            let isMate = false;

            if (line.includes('score cp')) {
                const match = line.match(/score cp (-?\d+)/);
                if (match) score = parseInt(match[1]);
            } else if (line.includes('score mate')) {
                const match = line.match(/score mate (-?\d+)/);
                if (match) {
                    isMate = true;
                    const mateIn = parseInt(match[1]);
                    score = mateIn > 0 ? 10000 - mateIn : -10000 - mateIn; 
                }
            }

            // Stockfish siempre da el score relativo al jugador que tiene el turno.
            // Para la gráfica (estilo Chess.com), siempre queremos la ventaja de las Blancas.
            // Necesitamos saber de quién es el turno.
            const currentFen = this.fens[this.currentFenIndex];
            const isWhiteTurn = currentFen.includes(' w ');
            if (!isWhiteTurn) {
                score = -score;
            }

            this.evaluations[this.currentFenIndex] = { score, isMate };
        }

        // Cuando termina la búsqueda para esta posición
        if (line.startsWith('bestmove')) {
            if (this.analysisTimeout) clearTimeout(this.analysisTimeout);
            const parts = line.split(' ');
            if (parts.length > 1 && parts[1] !== '(none)') {
                if (!this.evaluations[this.currentFenIndex]) {
                    this.evaluations[this.currentFenIndex] = { score: 0, isMate: false };
                }
                this.evaluations[this.currentFenIndex].bestmove = parts[1];
            }

            // Pasamos a la siguiente
            this.currentFenIndex++;
            if (this.onProgress) {
                this.onProgress(this.currentFenIndex, this.fens.length);
            }

            if (this.currentFenIndex < this.fens.length) {
                this.analyzeNextFen();
            } else {
                this.isAnalyzing = false;
                if (this.currentResolve) {
                    this.currentResolve(this.evaluations);
                    this.currentResolve = null;
                }
            }
        }
    }

    analyzeNextFen() {
        const fen = this.fens[this.currentFenIndex];
        this.worker.postMessage(`position fen ${fen}`);
        this.worker.postMessage(`go depth ${this.depth}`);
        
        if (this.analysisTimeout) clearTimeout(this.analysisTimeout);
        this.analysisTimeout = setTimeout(() => {
            console.warn('Stockfish hang detected on FEN:', fen);
            this.handleWorkerMessage({ data: 'bestmove (none)' });
        }, 5000);
    }

    async analyzeGame(fens, onProgressCallback) {
        if (this.isAnalyzing) {
            this.worker.postMessage('stop');
            if (this.analysisTimeout) clearTimeout(this.analysisTimeout);
        }
        
        this.fens = fens;
        this.evaluations = new Array(fens.length).fill(null);
        this.currentFenIndex = 0;
        this.onProgress = onProgressCallback;
        this.isAnalyzing = true;

        return new Promise((resolve) => {
            this.currentResolve = resolve;
            // Configurar hash table para mayor velocidad
            this.worker.postMessage('setoption name Hash value 32');
            this.analyzeNextFen();
        });
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
        }
    }
}
