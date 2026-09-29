const { spawn } = require('child_process');

/**
 * Gobuster — Directory/File/DNS/VHost fuzzing.
 * @param {string} mode   - 'dir' | 'dns' | 'vhost' | 'fuzz'
 * @param {string} url    - Target URL o dominio
 * @param {string} wordlist - Ruta a la wordlist
 * @param {object} options
 * @param {Function} onLine
 * @param {Function} onDone
 */
function fuzz(mode, url, wordlist, options = {}, onLine, onDone) {
    const args = [
        mode,
        '-u', url,
        '-w', wordlist || '/usr/share/wordlists/dirb/common.txt',
        '--no-error',
        '-q',
    ];

    if (options.extensions)   args.push('-x', options.extensions);   // e.g. "php,html,txt"
    if (options.threads)      args.push('-t', String(options.threads || 50));
    if (options.statusCodes)  args.push('-s', options.statusCodes);   // e.g. "200,204,301"
    if (options.excludeCodes) args.push('--exclude-length', options.excludeCodes);
    if (options.cookies)      args.push('-c', options.cookies);
    if (options.userAgent)    args.push('-a', options.userAgent);
    if (options.followRedir)  args.push('-r');
    if (options.insecure)     args.push('-k');
    if (options.outputFile)   args.push('-o', options.outputFile);
    if (options.delay)        args.push('--delay', options.delay);

    onLine(`$ gobuster ${args.join(' ')}`);

    const proc = spawn('gobuster', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => { buf += d.toString(); const ls = buf.split('\n'); buf = ls.pop(); ls.forEach(l => l.trim() && onLine(l)); });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(`[STDERR] ${l}`)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[gobuster] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine('[HINT] sudo apt install gobuster'); onDone(1); });
}

// Modos disponibles
const modes = [
    { id: 'dir',   name: 'Directory/File',  desc: 'Bruteforce directories y archivos' },
    { id: 'dns',   name: 'DNS Subdomain',   desc: 'Enumeración de subdominios DNS' },
    { id: 'vhost', name: 'Virtual Hosts',   desc: 'Descubrimiento de VHosts' },
    { id: 'fuzz',  name: 'Generic Fuzz',    desc: 'Fuzzing de parámetros con FUZZ' },
];

// Wordlists comunes en Kali/Parrot
const commonWordlists = [
    '/usr/share/wordlists/dirb/common.txt',
    '/usr/share/wordlists/dirb/big.txt',
    '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt',
    '/usr/share/wordlists/dirbuster/directory-list-2.3-small.txt',
    '/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt',
    '/usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt',
];

module.exports = { fuzz, modes, commonWordlists };
