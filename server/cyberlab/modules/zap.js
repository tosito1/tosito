const { spawn } = require('child_process');
const axios = require('axios');

const ZAP_HOST = process.env.ZAP_HOST || '127.0.0.1';
const ZAP_PORT = process.env.ZAP_PORT || 8090;
const ZAP_API_KEY = process.env.ZAP_API_KEY || 'cyberlab-zap-key';
const ZAP_PATH = process.env.ZAP_PATH || '/usr/share/zaproxy/zap.sh';

const BASE_URL = `http://${ZAP_HOST}:${ZAP_PORT}`;

let zapProcess = null;

/**
 * Comprueba si ZAP está corriendo respondiendo a su API.
 */
async function isRunning() {
    try {
        await axios.get(`${BASE_URL}/JSON/core/view/version/?apikey=${ZAP_API_KEY}`, { timeout: 3000 });
        return true;
    } catch {
        return false;
    }
}

/**
 * Lanza ZAP en modo daemon si no está corriendo.
 * @param {Function} onLine - Callback con líneas de log
 */
async function start(onLine) {
    if (await isRunning()) {
        onLine('[ZAP] Ya está corriendo.');
        return;
    }

    onLine(`[ZAP] Lanzando daemon en puerto ${ZAP_PORT}...`);
    onLine(`[ZAP] Path: ${ZAP_PATH}`);

    return new Promise((resolve, reject) => {
        zapProcess = spawn(ZAP_PATH, [
            '-daemon',
            '-port', ZAP_PORT.toString(),
            '-host', ZAP_HOST,
            '-config', `api.key=${ZAP_API_KEY}`,
            '-config', 'api.addrs.addr.name=.*',
            '-config', 'api.addrs.addr.regex=true',
        ], { shell: false });

        zapProcess.stdout.on('data', (d) => d.toString().split('\n').forEach(l => l.trim() && onLine(`[ZAP] ${l}`)));
        zapProcess.stderr.on('data', (d) => d.toString().split('\n').forEach(l => l.trim() && onLine(`[ZAP-ERR] ${l}`)));
        zapProcess.on('error', (err) => reject(new Error(`No se pudo lanzar ZAP: ${err.message}`)));

        // Esperar a que ZAP responda (max 60s)
        let attempts = 0;
        const maxAttempts = 30;
        const interval = setInterval(async () => {
            attempts++;
            onLine(`[ZAP] Esperando que esté listo... (${attempts}/${maxAttempts})`);
            if (await isRunning()) {
                clearInterval(interval);
                onLine('[ZAP] ¡Daemon listo!');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                reject(new Error('ZAP no respondió en 60 segundos'));
            }
        }, 2000);
    });
}

/**
 * Asegura que ZAP esté corriendo, lanzándolo si no.
 */
async function ensureRunning() {
    if (!(await isRunning())) {
        await start(console.log);
    }
}

/**
 * Lanza un spider sobre el target URL.
 * @returns {string} scanId
 */
async function spider(targetUrl) {
    const res = await axios.get(`${BASE_URL}/JSON/spider/action/scan/`, {
        params: { apikey: ZAP_API_KEY, url: targetUrl, maxChildren: 10, recurse: true }
    });
    return res.data.scan;
}

/**
 * Consulta el progreso del spider (0-100).
 */
async function spiderProgress(scanId) {
    const res = await axios.get(`${BASE_URL}/JSON/spider/view/status/`, {
        params: { apikey: ZAP_API_KEY, scanId }
    });
    return res.data.status;
}

/**
 * Lanza un active scan sobre el target URL.
 * @returns {string} scanId
 */
async function activeScan(targetUrl) {
    const res = await axios.get(`${BASE_URL}/JSON/ascan/action/scan/`, {
        params: { apikey: ZAP_API_KEY, url: targetUrl, recurse: true, inScopeOnly: false }
    });
    return res.data.scan;
}

/**
 * Consulta el progreso del active scan (0-100).
 */
async function activeScanProgress(scanId) {
    const res = await axios.get(`${BASE_URL}/JSON/ascan/view/status/`, {
        params: { apikey: ZAP_API_KEY, scanId }
    });
    return res.data.status;
}

/**
 * Obtiene las alertas encontradas.
 * @param {string} baseurl - Filtrar por URL base (opcional)
 */
async function getAlerts(baseurl = '') {
    const res = await axios.get(`${BASE_URL}/JSON/core/view/alerts/`, {
        params: { apikey: ZAP_API_KEY, baseurl, start: 0, count: 500 }
    });
    return res.data.alerts || [];
}

module.exports = { isRunning, start, ensureRunning, spider, spiderProgress, activeScan, activeScanProgress, getAlerts };
