const { spawn } = require('child_process');
const path = require('path');

/**
 * Nuclei — Escáner de vulnerabilidades basado en templates (ProjectDiscovery).
 * Incluye 10.000+ templates para CVEs, misconfigurations, exposures, etc.
 */
function scan(targets, options = {}, onLine, onDone) {
    // targets puede ser string (URL) o array de URLs
    const targetList = Array.isArray(targets) ? targets : [targets];

    const args = [];

    // Targets
    if (targetList.length === 1) {
        args.push('-u', targetList[0]);
    } else {
        // Escribir targets a fichero temp y usar -list (manejado externamente)
        args.push('-u', targetList[0]);
    }

    // Templates
    if (options.templates)   args.push('-t', options.templates);         // path o categoría
    else if (options.tags)   args.push('-tags', options.tags);           // e.g. "cve,sqli,xss"
    else if (options.severity) args.push('-severity', options.severity); // critical,high,medium,low,info

    if (options.excludeTags) args.push('-etags', options.excludeTags);
    if (options.rateLimit)   args.push('-rate-limit', String(options.rateLimit || 150));
    if (options.timeout)     args.push('-timeout', String(options.timeout || 10));
    if (options.retries)     args.push('-retries', String(options.retries || 1));
    if (options.noColor)     args.push('-no-color');
    if (options.outputFile)  args.push('-o', options.outputFile, '-json');
    if (options.interactsh)  args.push('-iserver', options.interactsh);  // OAST/OOB testing
    if (options.headless)    args.push('-headless');
    if (options.proxy)       args.push('-proxy', options.proxy);

    // Siempre verbose para streaming
    args.push('-v', '-stats');

    onLine(`$ nuclei ${args.join(' ')}`);

    const proc = spawn('nuclei', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (!l.trim()) return;
            // Colorear por severidad
            let prefix = '';
            if (l.includes('[critical]'))   prefix = '[CRITICAL]';
            else if (l.includes('[high]'))  prefix = '[HIGH]';
            else if (l.includes('[medium]'))prefix = '[MEDIUM]';
            else if (l.includes('[low]'))   prefix = '[LOW]';
            else if (l.includes('[info]'))  prefix = '[INFO]';
            onLine(prefix ? `${prefix} ${l}` : l);
        });
    });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(l)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[Nuclei] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine('[HINT] go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest'); onDone(1); });
}

// Categorías/tags más útiles de nuclei-templates
const templateTags = [
    { tag: 'cve',                  name: 'CVEs (todos)' },
    { tag: 'cve,2024',             name: 'CVE 2024' },
    { tag: 'cve,2023',             name: 'CVE 2023' },
    { tag: 'sqli',                 name: 'SQL Injection' },
    { tag: 'xss',                  name: 'Cross-Site Scripting' },
    { tag: 'ssrf',                 name: 'SSRF' },
    { tag: 'rce',                  name: 'Remote Code Execution' },
    { tag: 'lfi',                  name: 'Local File Inclusion' },
    { tag: 'idor',                 name: 'IDOR' },
    { tag: 'misconfig',            name: 'Misconfiguraciones' },
    { tag: 'exposure',             name: 'Information Exposure' },
    { tag: 'default-login',        name: 'Default Credentials' },
    { tag: 'auth-bypass',          name: 'Auth Bypass' },
    { tag: 'wordpress',            name: 'WordPress' },
    { tag: 'apache',               name: 'Apache' },
    { tag: 'nginx',                name: 'Nginx' },
    { tag: 'panel',                name: 'Admin Panels' },
    { tag: 'tech',                 name: 'Technology Detection' },
    { tag: 'network',              name: 'Network Services' },
];

module.exports = { scan, templateTags };
