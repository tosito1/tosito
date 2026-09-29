const { spawn } = require('child_process');

/**
 * Nikto — Escáner de vulnerabilidades en servidores web.
 */
function scan(target, options = {}, onLine, onDone) {
    const args = ['-h', target, '-nointeractive'];

    if (options.port)    args.push('-p', String(options.port));
    if (options.ssl)     args.push('-ssl');
    if (options.timeout) args.push('-timeout', String(options.timeout));
    if (options.plugins) args.push('-Plugins', options.plugins);
    if (options.tuning)  args.push('-Tuning', options.tuning);
    if (options.output)  args.push('-o', options.output, '-Format', options.format || 'txt');
    if (options.id)      args.push('-id', options.id);      // autenticación usuario:pass
    if (options.evasion) args.push('-evasion', options.evasion);
    if (options.useragent) args.push('-useragent', options.useragent);
    if (options.followRedirects) args.push('-followredirects');

    onLine(`$ nikto ${args.join(' ')}`);

    const proc = spawn('nikto', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => { buf += d.toString(); const ls = buf.split('\n'); buf = ls.pop(); ls.forEach(l => l.trim() && onLine(colorize(l))); });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(`[STDERR] ${l}`)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[Nikto] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine('[HINT] sudo apt install nikto'); onDone(1); });
}

// Categorías de tuning para enfocar el scan
const tuningOptions = [
    { id: '1', name: 'Interesting File / Seen in logs' },
    { id: '2', name: 'Misconfiguration / Default File' },
    { id: '3', name: 'Information Disclosure' },
    { id: '4', name: 'Injection (XSS/Script/HTML)' },
    { id: '5', name: 'Remote File Retrieval - Inside Web Root' },
    { id: '6', name: 'Denial of Service' },
    { id: '7', name: 'Remote File Retrieval - Server Wide' },
    { id: '8', name: 'Command Execution / Remote Shell' },
    { id: '9', name: 'SQL Injection' },
    { id: 'a', name: 'Authentication Bypass' },
    { id: 'b', name: 'Software Identification' },
    { id: 'c', name: 'Remote Source Inclusion' },
    { id: 'x', name: 'Reverse Tuning Options (include all except specified)' },
];

function colorize(line) {
    if (line.includes('+ OSVDB') || line.includes('+ ')) return `[VULN] ${line}`;
    return line;
}

module.exports = { scan, tuningOptions };
