const fs = require('fs');
const path = require('path');

// Rutas comunes de wordlists en sistemas Linux (Kali, Parrot, Ubuntu)
const WORDLIST_ROOTS = [
    '/usr/share/wordlists',
    '/usr/share/seclists',
    '/usr/share/dirb/wordlists',
    '/opt/wordlists',
];

/**
 * Devuelve el árbol de wordlists disponibles en el sistema.
 */
function list(rootDir) {
    const root = rootDir || '/usr/share/wordlists';
    const result = [];
    try {
        _walk(root, result, 0);
    } catch {}
    return result;
}

function _walk(dir, result, depth) {
    if (depth > 3) return; // evitar recursión excesiva
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory()) {
            result.push({ type: 'dir', name: e.name, path: fullPath });
            _walk(fullPath, result, depth + 1);
        } else if (e.isFile() && (e.name.endsWith('.txt') || e.name.endsWith('.lst') || e.name.endsWith('.dic'))) {
            try {
                const stat = fs.statSync(fullPath);
                result.push({
                    type: 'file', name: e.name, path: fullPath,
                    size: stat.size,
                    sizeHuman: _humanSize(stat.size),
                });
            } catch {}
        }
    }
}

/**
 * Devuelve las primeras N líneas de una wordlist.
 */
function preview(filePath, lines = 20) {
    if (!_isSafe(filePath)) return { error: 'Ruta no permitida' };
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const all = content.split('\n');
        return {
            path: filePath,
            totalLines: all.length,
            preview: all.slice(0, lines).join('\n'),
        };
    } catch (e) {
        return { error: e.message };
    }
}

function _isSafe(p) {
    // Solo permitir rutas dentro de directorios de wordlists conocidos
    return WORDLIST_ROOTS.some(root => p.startsWith(root)) || p.startsWith('/tmp/') || p.startsWith('/home/');
}

function _humanSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

// Wordlists de referencia siempre disponibles (si el sistema las tiene)
const wellKnown = [
    { name: 'rockyou.txt',                path: '/usr/share/wordlists/rockyou.txt',                    desc: '14M contraseñas — el estándar' },
    { name: 'common.txt (dirb)',           path: '/usr/share/wordlists/dirb/common.txt',                desc: 'Directorios web comunes' },
    { name: 'big.txt (dirb)',              path: '/usr/share/wordlists/dirb/big.txt',                   desc: 'Directorios web (grande)' },
    { name: 'directory-list-2.3-medium',  path: '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt', desc: 'DirBuster medium' },
    { name: 'fasttrack.txt',              path: '/usr/share/wordlists/fasttrack.txt',                  desc: 'Contraseñas rápidas/comunes' },
    { name: 'subdomains-top1m (seclists)',path: '/usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt', desc: 'Top 5000 subdominios' },
    { name: 'raft-medium-dirs (seclists)',path: '/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt', desc: 'RAFT directorios medium' },
    { name: 'default-passwords (seclists)',path: '/usr/share/seclists/Passwords/Default-Credentials/default-passwords.txt', desc: 'Contraseñas por defecto' },
];

module.exports = { list, preview, wellKnown, WORDLIST_ROOTS };
