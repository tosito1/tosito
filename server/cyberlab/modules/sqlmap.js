const { spawn } = require('child_process');

/**
 * SQLMap — Detección y explotación automática de SQL Injection.
 * @param {string} url - URL target (con parámetros, ej: http://target/page?id=1)
 * @param {object} options - { level, risk, dbs, tables, dump, dbname, tablename, data, cookie, headers, technique }
 * @param {Function} onLine
 * @param {Function} onDone
 */
function scan(url, options = {}, onLine, onDone) {
    if (!isValidUrl(url)) {
        onLine('[ERROR] URL inválida');
        onDone(1);
        return;
    }

    const args = [
        '-u', url,
        '--batch',              // Sin interacción
        '--random-agent',       // User-Agent aleatorio
        '--level',  String(options.level  || 1),
        '--risk',   String(options.risk   || 1),
    ];

    if (options.dbs)       args.push('--dbs');
    if (options.tables)    args.push('--tables');
    if (options.dump)      args.push('--dump');
    if (options.dbname)    args.push('-D', options.dbname);
    if (options.tablename) args.push('-T', options.tablename);
    if (options.data)      args.push('--data', options.data);
    if (options.cookie)    args.push('--cookie', options.cookie);
    if (options.technique) args.push('--technique', options.technique);
    if (options.headers)   args.push('--headers', options.headers);
    if (options.forms)     args.push('--forms');
    if (options.crawl)     args.push('--crawl', String(options.crawl));

    onLine(`$ sqlmap ${args.join(' ')}`);
    _runStreamed('sqlmap', args, onLine, onDone);
}

function isValidUrl(url) {
    try { new URL(url); return true; } catch { return false; }
}

function _runStreamed(cmd, args, onLine, onDone) {
    const proc = spawn(cmd, args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => { buf += d.toString(); const ls = buf.split('\n'); buf = ls.pop(); ls.forEach(l => l.trim() && onLine(l)); });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(`[STDERR] ${l}`)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[sqlmap] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine('[HINT] sudo apt install sqlmap'); onDone(1); });
    return proc;
}

// Técnicas de inyección disponibles
const techniques = [
    { id: 'B', name: 'Boolean-based blind' },
    { id: 'E', name: 'Error-based' },
    { id: 'U', name: 'UNION query-based' },
    { id: 'S', name: 'Stacked queries' },
    { id: 'T', name: 'Time-based blind' },
    { id: 'Q', name: 'Inline queries' },
];

module.exports = { scan, techniques };
