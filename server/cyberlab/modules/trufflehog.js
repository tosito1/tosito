const { spawn } = require('child_process');

/**
 * TruffleHog v3 — Escaneo de secretos en repositorios Git y más fuentes.
 * Detecta claves API, tokens, contraseñas en el historial de commits.
 */
function scan(source, target, options = {}, onLine, onDone) {
    // source: 'github' | 'gitlab' | 'git' | 'filesystem' | 's3' | 'docker'
    const args = [source, target, '--json'];

    if (options.onlyVerified) args.push('--only-verified');
    if (options.concurrency)  args.push('--concurrency', String(options.concurrency || 8));
    if (options.branch)       args.push('--branch', options.branch);
    if (options.since)        args.push('--since-commit', options.since);
    if (options.maxDepth)     args.push('--max-depth', String(options.maxDepth));
    if (options.token)        args.push('--token', options.token);  // GitHub/GitLab token

    onLine(`$ trufflehog ${args.join(' ')}`);
    onLine(`[INFO] Escaneando ${source}: ${target}`);
    onLine('[INFO] Buscando secretos verificables en el historial...');

    const proc = spawn('trufflehog', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (!l.trim()) return;
            try {
                const obj = JSON.parse(l);
                onLine(`\n[SECRET FOUND] ─────────────────────────────`);
                onLine(`  Detector:   ${obj.DetectorName || 'Unknown'}`);
                onLine(`  Verified:   ${obj.Verified ? '✓ VERIFICADO' : '✗ no verificado'}`);
                onLine(`  Source:     ${obj.SourceMetadata?.Data?.Git?.repository || obj.SourceMetadata?.Data?.Github?.repository || target}`);
                if (obj.SourceMetadata?.Data?.Git?.commit) onLine(`  Commit:     ${obj.SourceMetadata.Data.Git.commit}`);
                if (obj.Raw)           onLine(`  Raw Secret: ${obj.Raw.slice(0,80)}${obj.Raw.length>80?'...':''}`);
                if (obj.RawV2)         onLine(`  Secret V2:  ${obj.RawV2.slice(0,80)}`);
                if (obj.StructuredData) onLine(`  Structured: ${JSON.stringify(obj.StructuredData).slice(0,100)}`);
            } catch { onLine(l); }
        });
    });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(l)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[TruffleHog] Exit: ${code}`); onDone(code); });
    proc.on('error', err => {
        onLine(`[ERROR] ${err.message}`);
        onLine('[HINT] curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh');
        onDone(1);
    });
}

const sources = [
    { id: 'github',     name: 'GitHub',     placeholder: 'https://github.com/org  o  --repo https://github.com/org/repo',    desc: 'Organización o repo GitHub' },
    { id: 'gitlab',     name: 'GitLab',     placeholder: 'https://gitlab.com/org',                                            desc: 'Organización o repo GitLab' },
    { id: 'git',        name: 'Git (local)',placeholder: '/ruta/al/repo.git  o  https://github.com/org/repo',                 desc: 'Repositorio Git local o remoto' },
    { id: 'filesystem', name: 'Filesystem', placeholder: '/ruta/al/directorio',                                               desc: 'Escaneo de sistema de archivos' },
    { id: 'docker',     name: 'Docker',     placeholder: 'image:tag  o  sha256:...',                                          desc: 'Imagen Docker' },
    { id: 's3',         name: 'S3 Bucket',  placeholder: 's3://bucket-name',                                                  desc: 'AWS S3 Bucket' },
];

module.exports = { scan, sources };
