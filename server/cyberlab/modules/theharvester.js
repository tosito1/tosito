const { spawn } = require('child_process');

/**
 * theHarvester — OSINT: emails, subdominios, IPs, hosts, URLs.
 * @param {string} domain - Dominio objetivo
 * @param {string[]} sources - Fuentes: google, bing, duckduckgo, crtsh, dnsdumpster, shodan...
 * @param {object} options - { limit, dnsLookup, dnsServer, takeOver, screenshot }
 * @param {Function} onLine
 * @param {Function} onDone
 */
function harvest(domain, sources = ['google', 'bing', 'crtsh', 'dnsdumpster'], options = {}, onLine, onDone) {
    const args = [
        '-d', domain,
        '-b', sources.join(','),
        '-l', String(options.limit || 500),
    ];

    if (options.dnsLookup)  args.push('-n');
    if (options.dnsServer)  args.push('-c');   // DNS brute force
    if (options.takeOver)   args.push('-t');   // detectar subdomain takeover
    if (options.virtual)    args.push('-v');   // virtual hosts

    onLine(`$ theHarvester ${args.join(' ')}`);

    const proc = spawn('theHarvester', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => { buf += d.toString(); const ls = buf.split('\n'); buf = ls.pop(); ls.forEach(l => l.trim() && onLine(l)); });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(`[INFO] ${l}`)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[theHarvester] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine('[HINT] pip install theHarvester  o  apt install theharvester'); onDone(1); });
}

const availableSources = [
    'anubis', 'baidu', 'bevigil', 'binaryedge', 'bing', 'bingapi', 'brave',
    'bufferoverun', 'censys', 'certspotter', 'criminalip', 'crtsh',
    'dnsdumpster', 'duckduckgo', 'fullhunt', 'github-code',
    'google', 'hackertarget', 'hunter', 'hunterhow', 'intelx',
    'netlas', 'onyphe', 'otx', 'pentesttools', 'projectdiscovery',
    'rapiddns', 'securityTrails', 'shodan', 'sitedossier',
    'subdomaincenter', 'subdomainfinderc99', 'threatminer', 'virustotal',
    'yahoo', 'zoomeye',
];

module.exports = { harvest, availableSources };
