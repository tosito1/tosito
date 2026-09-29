const { spawn } = require('child_process');

/**
 * Subfinder — Enumeración pasiva de subdominios.
 */
function enumerate(domain, options = {}, onLine, onDone) {
    const args = ['-d', domain, '-silent'];

    if (options.all)       args.push('-all');           // usar todas las fuentes
    if (options.sources)   args.push('-s', options.sources.join(','));
    if (options.recursive) args.push('-recursive');
    if (options.threads)   args.push('-t', String(options.threads || 10));
    if (options.timeout)   args.push('-timeout', String(options.timeout || 30));
    if (options.resolvers) args.push('-r', options.resolvers);
    if (options.outputFile)args.push('-o', options.outputFile);

    onLine(`$ subfinder ${args.join(' ')}`);

    const proc = spawn('subfinder', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (l.trim()) onLine(`[SUBDOMAIN] ${l.trim()}`);
        });
    });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(`[INFO] ${l}`)));
    proc.on('close', code => { if (buf.trim()) onLine(`[SUBDOMAIN] ${buf.trim()}`); onLine(`\n[Subfinder] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine('[HINT] go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest'); onDone(1); });
}

module.exports = { enumerate };
