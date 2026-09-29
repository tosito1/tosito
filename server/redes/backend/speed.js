const speedTest = require('speedtest-net');

let isRunning = false;
let lastResult = null;

async function runSpeedTest() {
    if (isRunning) return { status: 'running', message: 'El test ya está en ejecución' };
    isRunning = true;
    
    try {
        console.log('Iniciando Speedtest...');
        const result = await speedTest({ acceptLicense: true, acceptGdpr: true });
        
        lastResult = {
            ping: result.ping.latency,
            download: result.download.bandwidth * 8 / 1000000, // Mbps
            upload: result.upload.bandwidth * 8 / 1000000, // Mbps
            isp: result.isp,
            timestamp: new Date().toISOString()
        };
        
        console.log(`Speedtest completado: ${lastResult.download.toFixed(1)} Mbps Bajada / ${lastResult.upload.toFixed(1)} Mbps Subida`);
        isRunning = false;
        return { status: 'success', data: lastResult };
    } catch (err) {
        console.error('Error en Speedtest:', err.message);
        isRunning = false;
        return { status: 'error', message: err.message };
    }
}

function getLastSpeedTest() {
    return lastResult;
}

module.exports = { runSpeedTest, getLastSpeedTest };
