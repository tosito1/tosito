const { spawn } = require('child_process');

/**
 * RustScan — Escáner de puertos ultrarrápido en Rust.
 * Escanea los 65535 puertos en segundos e integra con Nmap.
 * @param {string} target
 * @param {object} options - { ports, batch, ulimit, timeout, nmapFlags, noNmap, addresses }
 * @param {Function} onLine
 * @param {Function} onDone
 */
function scan(target, options = {}, onLine, onDone) {
    const args = [
        '--addresses', target,
        '--batch-size', String(options.batch || 65535),
        '--timeout',    String(options.timeout || 1500),
        '--ulimit',     String(options.ulimit  || 5000),
    ];

    if (options.ports)  args.push('--ports', options.ports);  // e.g. "80,443,8080" or "1-1000"
    if (options.noNmap) args.push('--no-nmap');
    if (options.greppable) args.push('--greppable');
    if (options.scripts) args.push('--scripts', options.scripts);

    // Por defecto pasa los resultados a Nmap con -sV -O
    if (!options.noNmap) {
        const nmapFlags = options.nmapFlags || '-sV --script=default';
        // RustScan pasa a nmap con: -- <flags>
        args.push('--');
        args.push(...nmapFlags.split(' ').filter(Boolean));
    }

    onLine(`$ rustscan ${args.join(' ')}`);
    onLine('[INFO] RustScan: escaneando puertos a velocidad máxima...');

    const proc = spawn('rustscan', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (!l.trim()) return;
            let line = l;
            if (l.includes('Open'))   line = `[OPEN] ${l}`;
            else if (l.includes('Nmap')) line = `[NMAP] ${l}`;
            onLine(line);
        });
    });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(l)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[RustScan] Exit: ${code}`); onDone(code); });
    proc.on('error', err => {
        onLine(`[ERROR] ${err.message}`);
        onLine('[HINT] cargo install rustscan  o  docker run -it --rm --name rustscan rustscan/rustscan');
        onDone(1);
    });
}

// Presets de escaneo
const presets = [
    { id: 'quick',    name: 'Quick (top ports)',    batch: 10000, nmapFlags: '-sV -T4',        desc: 'Top puertos rápido' },
    { id: 'full',     name: 'Full (65535)',          batch: 65535, nmapFlags: '-sV -O -A -T4',  desc: 'Todos los puertos + Nmap full' },
    { id: 'stealth',  name: 'Stealth',              batch: 5000,  nmapFlags: '-sS -sV -T2',    desc: 'SYN silencioso' },
    { id: 'vuln',     name: 'Vuln Scripts',          batch: 65535, nmapFlags: '--script=vuln',  desc: 'NSE scripts de vulnerabilidades' },
    { id: 'no-nmap',  name: 'Ports Only',            batch: 65535, noNmap: true,               desc: 'Solo puertos, sin Nmap' },
];

module.exports = { scan, presets };
