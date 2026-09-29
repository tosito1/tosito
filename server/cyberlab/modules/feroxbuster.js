const { spawn } = require('child_process');

/**
 * Feroxbuster — Fuzzing recursivo de contenido web extremadamente rápido.
 * @param {string} url - URL objetivo
 * @param {object} options - { wordlist, threads, depth, extensions, statusFilter, timeout, cookies, headers, rateLimit, outputFile, noRecurse, quiet }
 * @param {Function} onLine
 * @param {Function} onDone
 */
function fuzz(url, options = {}, onLine, onDone) {
    const args = [
        '--url',        url,
        '--wordlist',   options.wordlist || '/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt',
        '--threads',    String(options.threads || 50),
        '--depth',      String(options.depth || 4),   // recursión hasta N niveles
        '--timeout',    String(options.timeout || 7),
        '--no-state',   // no crear ficheros de estado
        '--quiet',
    ];

    if (options.extensions)   args.push('--extensions', options.extensions);   // php,html,txt
    if (options.statusFilter) args.push('--filter-status', options.statusFilter); // 404,403
    if (options.sizeFilter)   args.push('--filter-size', options.sizeFilter);
    if (options.wordFilter)   args.push('--filter-words', options.wordFilter);
    if (options.cookies)      args.push('--cookies', options.cookies);
    if (options.headers)      args.push('--headers', options.headers);
    if (options.rateLimit)    args.push('--rate-limit', String(options.rateLimit));
    if (options.outputFile)   args.push('--output', options.outputFile, '--json');
    if (options.noRecurse)    args.push('--no-recursion');
    if (options.insecure)     args.push('--insecure');
    if (options.followRedirects) args.push('--redirects');
    if (options.proxy)        args.push('--proxy', options.proxy);
    if (options.userAgent)    args.push('--user-agent', options.userAgent);

    onLine(`$ feroxbuster ${args.join(' ')}`);
    onLine(`[INFO] Fuzzing recursivo activado (depth: ${options.depth || 4})`);

    const proc = spawn('feroxbuster', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (!l.trim()) return;
            // Colorear por código HTTP
            let line = l;
            if (/\b200\b/.test(l))       line = `[200] ${l}`;
            else if (/\b(301|302)\b/.test(l)) line = `[REDIR] ${l}`;
            else if (/\b403\b/.test(l))  line = `[403] ${l}`;
            onLine(line);
        });
    });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(l)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[feroxbuster] Exit: ${code}`); onDone(code); });
    proc.on('error', err => {
        onLine(`[ERROR] ${err.message}`);
        onLine('[HINT] cargo install feroxbuster  o  apt install feroxbuster');
        onDone(1);
    });
}

const wordlistSuggestions = [
    '/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt',
    '/usr/share/seclists/Discovery/Web-Content/raft-large-directories.txt',
    '/usr/share/seclists/Discovery/Web-Content/raft-medium-files.txt',
    '/usr/share/seclists/Discovery/Web-Content/common.txt',
    '/usr/share/seclists/Discovery/Web-Content/big.txt',
    '/usr/share/wordlists/dirb/common.txt',
    '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt',
];

module.exports = { fuzz, wordlistSuggestions };
