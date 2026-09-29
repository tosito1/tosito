const si = require('systeminformation');

let lastStats = null;
let trafficListeners = [];

async function getTrafficStats() {
    try {
        const stats = await si.networkStats();
        const now = Date.now();
        
        // Filtrar solo interfaces activas con datos
        const activeIfaces = stats.filter(s => s.rx_bytes > 0 || s.tx_bytes > 0);
        
        if (!activeIfaces.length) return null;
        
        // Sumar todas las interfaces
        const totalRx = activeIfaces.reduce((sum, s) => sum + s.rx_sec, 0);
        const totalTx = activeIfaces.reduce((sum, s) => sum + s.tx_sec, 0);

        return {
            rx: Math.max(0, totalRx),  // bytes/sec de bajada
            tx: Math.max(0, totalTx),  // bytes/sec de subida
            timestamp: now,
            interfaces: activeIfaces.map(s => ({
                iface: s.iface,
                rx: s.rx_sec,
                tx: s.tx_sec
            }))
        };
    } catch (err) {
        console.error('Error leyendo tráfico:', err.message);
        return null;
    }
}

function startTrafficMonitor(callback) {
    // Emitir stats cada 2 segundos
    setInterval(async () => {
        const stats = await getTrafficStats();
        if (stats) callback(stats);
    }, 2000);
}

module.exports = { startTrafficMonitor, getTrafficStats };
