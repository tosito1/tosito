const { spawn } = require('child_process');

/**
 * tshark — Captura y análisis de tráfico de red en tiempo real (Wireshark CLI).
 */
function capture(options = {}, onLine, onDone) {
    const args = [];

    if (options.interface) args.push('-i', options.interface);
    else args.push('-i', 'any');

    if (options.filter)   args.push('-f', options.filter);     // filtro captura BPF
    if (options.display)  args.push('-Y', options.display);    // filtro display Wireshark
    if (options.count)    args.push('-c', String(options.count));
    if (options.duration) args.push('-a', `duration:${options.duration}`);
    if (options.file)     args.push('-w', options.file);       // guardar pcap
    if (options.read)     args.push('-r', options.read);       // leer pcap
    if (options.fields) {
        args.push('-T', 'fields');
        options.fields.forEach(f => args.push('-e', f));
    } else {
        args.push('-T', 'text');
    }
    if (options.verbose)   args.push('-V');
    if (options.noPromiscuous) args.push('-p');

    onLine(`$ tshark ${args.join(' ')}`);
    onLine('[INFO] Captura iniciada. Requiere privilegios root/CAP_NET_RAW');

    const proc = spawn('tshark', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => { buf += d.toString(); const ls = buf.split('\n'); buf = ls.pop(); ls.forEach(l => l.trim() && onLine(l)); });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(`[INFO] ${l}`)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[tshark] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine('[HINT] sudo apt install tshark  |  sudo setcap cap_net_raw+eip $(which tshark)'); onDone(1); });

    return proc;
}

/**
 * Lista las interfaces de red disponibles.
 */
function listInterfaces(callback) {
    const proc = spawn('tshark', ['-D'], { shell: false });
    let out = '';
    proc.stdout.on('data', d => out += d.toString());
    proc.on('close', () => {
        const interfaces = out.split('\n')
            .filter(l => l.trim())
            .map(l => {
                const m = l.match(/^\d+\.\s+(.+?)\s/);
                return m ? m[1] : l.trim();
            })
            .filter(Boolean);
        callback(interfaces);
    });
    proc.on('error', () => callback(['eth0', 'lo', 'any']));
}

// Filtros de captura BPF comunes
const commonFilters = [
    { filter: 'tcp',                   name: 'Solo TCP' },
    { filter: 'udp',                   name: 'Solo UDP' },
    { filter: 'http',                  name: 'HTTP (puerto 80)' },
    { filter: 'port 443',              name: 'HTTPS (puerto 443)' },
    { filter: 'port 22',               name: 'SSH (puerto 22)' },
    { filter: 'port 445',              name: 'SMB (puerto 445)' },
    { filter: 'icmp',                  name: 'ICMP / Ping' },
    { filter: 'dns',                   name: 'DNS (puerto 53)' },
    { filter: 'not arp and not igmp',  name: 'Sin ARP/IGMP' },
    { filter: 'tcp[tcpflags] & tcp-syn != 0', name: 'Solo SYN (nuevo handshake)' },
];

module.exports = { capture, listInterfaces, commonFilters };
