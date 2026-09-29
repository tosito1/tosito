const dgram = require('dgram');
const dns2 = require('dns2');

let server;

function startDnsServer(db, io) {
    server = dgram.createSocket('udp4');
    
    server.on('message', async (msg, rinfo) => {
        try {
            const request = dns2.Packet.parse(msg);
            const question = request.questions[0];
            if (question) {
                const name = question.name;
                const clientIp = rinfo.address;
                
                db.logDnsRequest(clientIp, name).catch(console.error);
                io.emit('dns_request', {
                    ip: clientIp,
                    domain: name,
                    timestamp: new Date().toISOString()
                });

                // Comprobar DNS personalizado
                const customIp = await db.resolveCustomDns(name);
                
                // Comprobar AdBlock
                let isAdBlocked = false;
                if (!customIp) {
                    const adblockEnabled = await db.getSetting('adblock_enabled');
                    if (adblockEnabled === 'true') {
                        const adblock = require('./adblock');
                        if (adblock.isBlocked(name)) {
                            isAdBlocked = true;
                            db.incrementAdblockCount().catch(()=>{});
                            io.emit('adblock_event', { domain: name, ip: clientIp });
                        }
                    }
                }

                if (customIp || isAdBlocked) {
                    const response = dns2.Packet.createResponseFromRequest(request);
                    response.header.ra = 1; // Recursion Available
                    response.header.aa = 1; // Authoritative Answer

                    // Solo inyectar Record A si la pregunta es A o ANY
                    if (question.type === dns2.Packet.TYPE.A || question.type === dns2.Packet.TYPE.ANY) {
                        response.answers.push({
                            name: name,
                            type: dns2.Packet.TYPE.A,
                            class: dns2.Packet.CLASS.IN,
                            ttl: 60,
                            address: isAdBlocked ? '0.0.0.0' : customIp
                        });
                    }
                    
                    server.send(response.toBuffer(), rinfo.port, rinfo.address);
                    return; // Terminamos aquí, no vamos a Google
                }
            }
        } catch (e) {
            // Ignorar errores de parseo
        }

        try {
            // Reenviamos los bytes EXACTOS a Google DNS (8.8.8.8)
            const client = dgram.createSocket('udp4');
            let closed = false;
            const safeClose = () => {
                if (!closed) {
                    closed = true;
                    try { client.close(); } catch(e) {}
                }
            };
            
            client.on('message', (responseMsg) => {
                // Devolvemos la respuesta exacta al cliente original
                try { server.send(responseMsg, rinfo.port, rinfo.address); } catch(e){}
                safeClose();
            });
            
            client.on('error', () => {
                safeClose();
            });

            client.send(msg, 53, '8.8.8.8', (err) => {
                if (err) safeClose();
            });

            // Timeout de 2 segundos por si Google no responde
            setTimeout(() => safeClose(), 2000);
        } catch (globalErr) {
            // Ignorar errores fatales en el proxy
        }
    });

    const PORT = process.env.DNS_PORT || 53;
    
    server.on('listening', () => {
        console.log(`📡 Servidor DNS Proxy iniciado en puerto ${PORT}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EACCES') {
            console.warn(`\n⚠️ ERROR DNS: No hay permisos de Administrador para abrir el puerto 53.`);
            console.log(`Intentando levantar DNS en puerto 5353 como alternativa...`);
            try { server.bind(5353); } catch(e){}
        } else if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️ ERROR DNS: El puerto 53 ya está en uso.`);
        } else {
            console.error('Error del servidor DNS:', err.message);
        }
    });

    try {
        server.bind(PORT);
    } catch(e) {
        console.error('No se pudo iniciar el servidor DNS');
    }
}

module.exports = { startDnsServer };
