const { spawn } = require('child_process');

/**
 * Gitleaks — Escáner de secretos en Git, más rápido que TruffleHog.
 * Usa reglas TOML configurables (baseline, custom rules).
 */
function scan(source, target, options = {}, onLine, onDone) {
    // source: 'detect' (local) | 'protect' (pre-commit) | 'git' (remote)
    const cmd = source === 'remote' ? 'git' : (source || 'detect');
    const args = [cmd];

    if (target)           args.push('--source', target);
    if (options.config)   args.push('--config', options.config);  // .toml custom rules
    if (options.report)   args.push('--report-path', options.report, '--report-format', options.reportFormat || 'json');
    if (options.baseline) args.push('--baseline-path', options.baseline);
    if (options.verbose)  args.push('--verbose');
    if (options.noGit)    args.push('--no-git');
    if (options.branch)   args.push('--log-opts', `--branches=${options.branch}`);
    if (options.since)    args.push('--log-opts', `--after=${options.since}`);
    if (options.redact)   args.push('--redact');
    if (options.threads)  args.push('--max-go-routines', String(options.threads || 8));

    onLine(`$ gitleaks ${args.join(' ')}`);

    const proc = spawn('gitleaks', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (!l.trim()) return;
            if (l.toLowerCase().includes('finding') || l.toLowerCase().includes('secret'))
                onLine(`[FOUND] ${l}`);
            else onLine(l);
        });
    });
    proc.stderr.on('data', d => {
        const txt = d.toString();
        txt.split('\n').forEach(l => {
            if (!l.trim()) return;
            // Gitleaks escribe resultados en stderr también (JSON)
            try {
                const obj = JSON.parse(l);
                if (obj.Secret) {
                    onLine(`\n[SECRET] ─────────────────────────────────`);
                    onLine(`  Rule:    ${obj.RuleID || 'custom'}`);
                    onLine(`  File:    ${obj.File || '—'}`);
                    onLine(`  Line:    ${obj.StartLine || '—'}`);
                    onLine(`  Commit:  ${(obj.Commit || '—').slice(0, 12)}`);
                    onLine(`  Author:  ${obj.Author || '—'}`);
                    onLine(`  Secret:  ${obj.Secret ? obj.Secret.slice(0, 60) + '...' : '—'}`);
                }
            } catch { onLine(l); }
        });
    });
    proc.on('close', code => {
        if (buf.trim()) onLine(buf);
        if (code === 0) onLine('\n[✓] No se encontraron secretos', 'done');
        if (code === 1) onLine('\n[!] Secretos encontrados — revisa el output', 'warn');
        onLine(`\n[Gitleaks] Exit: ${code}`);
        onDone(code);
    });
    proc.on('error', err => {
        onLine(`[ERROR] ${err.message}`);
        onLine('[HINT] https://github.com/gitleaks/gitleaks/releases  o  brew install gitleaks');
        onDone(1);
    });
}

const modes = [
    { id: 'detect',  name: 'detect',  desc: 'Escanea repo local (historial completo)' },
    { id: 'protect', name: 'protect', desc: 'Pre-commit hook (staged changes only)' },
];

// Tipos de secretos que detecta por defecto
const defaultRules = [
    'AWS Access Key', 'AWS Secret Key', 'GitHub Token (PAT)', 'GitLab Token',
    'Google API Key', 'Google OAuth', 'Stripe API Key', 'Twilio API Key',
    'Heroku API Key', 'SendGrid API Key', 'Slack Bot Token', 'Slack Webhook',
    'RSA Private Key', 'SSH Private Key', 'PGP Private Key',
    'JWT Token', 'Basic Auth credentials', 'Generic API Key pattern',
    'Password in code', 'High entropy string', 'NPM Token', 'Docker Hub Token',
];

module.exports = { scan, modes, defaultRules };
