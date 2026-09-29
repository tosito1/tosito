const { spawn } = require('child_process');

/**
 * Gitrob — Reconocimiento de organizaciones GitHub.
 * Busca repos públicos con información sensible expuesta.
 * NOTA: gitrob es más antiguo; como alternativa también soporta gh-dork.
 */
function scan(target, options = {}, onLine, onDone) {
    const args = [target];

    if (options.token)       args.unshift('-github-access-token', options.token);
    if (options.depth)       args.push('-commit-depth', String(options.depth || 500));
    if (options.threads)     args.push('-threads', String(options.threads || 2));
    if (options.forks)       args.push('-forks');
    if (options.port)        args.push('-port', String(options.port || 9393));
    if (options.server)      args.push('-serve');  // servir web UI

    onLine(`$ gitrob ${args.join(' ')}`);
    onLine(`[INFO] Escaneando organización/usuario: ${target}`);
    onLine('[INFO] Buscando archivos sensibles en repos públicos...');

    const proc = spawn('gitrob', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => { buf += d.toString(); const ls = buf.split('\n'); buf = ls.pop(); ls.forEach(l => l.trim() && onLine(l)); });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(l)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[Gitrob] Exit: ${code}`); onDone(code); });
    proc.on('error', err => {
        onLine(`[ERROR] ${err.message}`);
        onLine('[HINT] go install github.com/michenriksen/gitrob@latest');
        onLine('[ALT]  Considera usar: gitleaks detect --source https://github.com/ORG');
        onDone(1);
    });
}

// Tipos de archivos que busca Gitrob
const sensitiveFilePatterns = [
    '*.pem',        '*.key',        '*.p12',       '*.pfx',
    '.htpasswd',    '.netrc',       '.npmrc',       '.env',
    'credentials',  'secret',       'token',        'password',
    '*.sql',        '*.dump',       '*.db',         '*.sqlite',
    '*.log',        'config.yml',   'settings.py',  'database.yml',
    'wp-config.php','web.config',   '.dockercfg',   'Dockerfile',
    'id_rsa',       'id_dsa',       '*.ppk',        '*.keystore',
    'shadow',       'passwd',       '*.ovpn',       '*.jks',
];

module.exports = { scan, sensitiveFilePatterns };
