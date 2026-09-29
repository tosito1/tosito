const https = require('https');
const fs = require('fs');
const path = require('path');

const LIST_URL = 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts';
const LOCAL_CACHE = path.join(__dirname, 'adblock_list.txt');
const blocklist = new Set();
let isReady = false;

function parseHostsFile(content) {
    blocklist.clear();
    const lines = content.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        const parts = line.split(/\s+/);
        if (parts.length >= 2 && (parts[0] === '0.0.0.0' || parts[0] === '127.0.0.1')) {
            const domain = parts[1];
            if (domain !== 'localhost' && domain !== '127.0.0.1' && domain !== '0.0.0.0' && domain !== 'broadcasthost') {
                blocklist.add(domain);
            }
        }
    }
    isReady = true;
    console.log(`🛡️ AdBlock activado: ${blocklist.size} dominios cargados en memoria.`);
}

function updateList() {
    return new Promise((resolve, reject) => {
        console.log('Descargando lista de dominios bloqueados...');
        https.get(LIST_URL, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error('Failed to download list'));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                fs.writeFileSync(LOCAL_CACHE, data, 'utf-8');
                parseHostsFile(data);
                resolve(blocklist.size);
            });
        }).on('error', reject);
    });
}

function init() {
    if (fs.existsSync(LOCAL_CACHE)) {
        try {
            const data = fs.readFileSync(LOCAL_CACHE, 'utf-8');
            parseHostsFile(data);
        } catch (e) {
            updateList().catch(console.error);
        }
    } else {
        updateList().catch(console.error);
    }
}

function isBlocked(domain) {
    if (!isReady || !domain) return false;
    // Quitamos subdominios si es necesario, o comprobamos directamente
    // La lista de StevenBlack es exhaustiva con subdominios.
    return blocklist.has(domain.toLowerCase());
}

function getStats() {
    return {
        totalDomains: blocklist.size,
        isReady
    };
}

module.exports = {
    init,
    updateList,
    isBlocked,
    getStats
};
