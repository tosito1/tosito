const mdns = require('multicast-dns')();
const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

console.log('[mDNS] Servidor iniciado. Resolviendo .local dinámicamente.');

mdns.on('query', function(query) {
    query.questions.forEach(q => {
        if (q.name.endsWith('.local') && q.type === 'A') {
            const currentIp = getLocalIp();
            console.log(`[mDNS] Consulta recibida para: ${q.name}. Respondiendo con ${currentIp}...`);
            mdns.respond({
                answers: [{
                    name: q.name,
                    type: 'A',
                    ttl: 120,
                    data: currentIp
                }]
            });
        }
    });
});
