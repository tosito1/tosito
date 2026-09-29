const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { startScanning, getCurrentDevices } = require('./scanner');
const db = require('./database');
const { wakeDevice } = require('./controller');
const { startTrafficMonitor } = require('./traffic');
const { sendAlert, testConnection } = require('./mailer');
const { sendTelegramAlert, testTelegram, refreshBot } = require('./telegram');
const { runSpeedTest, getLastSpeedTest } = require('./speed');
const { runAudit } = require('./auditor');
const { startDnsServer } = require('./dns_server');
const auth = require('./auth');
const routerControl = require('./router_control');
const tunnelControl = require('./tunnel');
const zte = require('./zte_router');


const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ────────────── Middleware ──────────────
app.use(auth.sessionMiddleware);
app.use(express.json());

// ────────────── Rutas públicas ──────────────
app.get('/login', (req, res) => {
    if (req.session && req.session.authenticated) return res.redirect('/');
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.post('/api/login', auth.handleLogin);
app.post('/api/logout', auth.handleLogout);

// ────────────── Rutas protegidas ──────────────
app.use(auth.requireAuth);
app.use(express.static(path.join(__dirname, '../frontend'), { index: false }));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API: Configuración
app.get('/api/settings', async (req, res) => {
    const keys = ['smtp_host', 'smtp_port', 'smtp_user', 'alert_email', 'telegram_token', 'telegram_chat_id'];
    const settings = {};
    for (const k of keys) {
        settings[k] = await db.getSetting(k);
    }
    res.json(settings);
});

app.post('/api/settings', async (req, res) => {
    try {
        for (const [key, value] of Object.entries(req.body)) {
            if (key !== 'smtp_pass' || value) { // No borrar pass si viene vacío
                await db.setSetting(key, value);
            }
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/settings/test-email', async (req, res) => {
    const result = await testConnection(req.body);
    res.json(result);
});

app.post('/api/settings/test-telegram', async (req, res) => {
    const { token, chat_id } = req.body;
    const result = await testTelegram(token, chat_id);
    res.json(result);
});

app.post('/api/settings/save-telegram', async (req, res) => {
    try {
        const { token, chat_id } = req.body;
        await db.setSetting('telegram_token', token);
        await db.setSetting('telegram_chat_id', chat_id);
        const { refreshBot } = require('./telegram');
        await refreshBot();
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────────── Endpoints AdBlock ──────────────
app.get('/api/adblock', async (req, res) => {
    try {
        const adblock = require('./adblock');
        const enabled = await db.getSetting('adblock_enabled') === 'true';
        const stats = adblock.getStats();
        const blockedCount = await db.getAdblockStats();
        res.json({
            enabled,
            isReady: stats.isReady,
            totalDomains: stats.totalDomains,
            blockedCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/adblock/toggle', async (req, res) => {
    try {
        const { enabled } = req.body;
        await db.setSetting('adblock_enabled', enabled ? 'true' : 'false');
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/adblock/update', async (req, res) => {
    try {
        const adblock = require('./adblock');
        const count = await adblock.updateList();
        res.json({ ok: true, count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings/change-password', auth.changePassword);

// API: Historial de latencia
app.get('/api/latency/:ip', async (req, res) => {
    try {
        const data = await db.getLatencyHistory(req.params.ip, 6);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── V4 ENDPOINTS ──

// Speedtest
app.get('/api/speedtest', (req, res) => {
    res.json(getLastSpeedTest() || { status: 'none' });
});
app.post('/api/speedtest', async (req, res) => {
    const result = await runSpeedTest();
    res.json(result);
});

// Auditoría
app.post('/api/audit/:ip', async (req, res) => {
    try {
        const result = await runAudit(req.params.ip);
        res.json({ ok: true, result });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Perfiles
app.get('/api/profiles', async (req, res) => {
    try {
        const profiles = await db.getProfiles();
        res.json(profiles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/profiles', async (req, res) => {
    try {
        const { name, icon, color } = req.body;
        const id = await db.addProfile(name, icon, color);
        res.json({ ok: true, id });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});
app.post('/api/profiles/assign', async (req, res) => {
    try {
        const { ip, profileId } = req.body;
        await db.assignProfile(ip, profileId);
        io.emit('profile_assigned', { ip, profileId });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// DNS Stats
app.get('/api/dns/stats', async (req, res) => {
    try {
        const stats = await db.getDnsStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Analytics (Datos globales)
app.get('/api/analytics', async (req, res) => {
    try {
        const devices = await db.getAllDevices();
        const hourlyData = await db.getHourlyConnections();
        
        let online = 0, offline = 0, untrusted = 0;
        let totalLatency = 0, latencyCount = 0;
        const categories = {};
        const vendors = {};

        devices.forEach(d => {
            if (d.is_online) online++; else offline++;
            if (!d.is_trusted) untrusted++;
            
            if (d.category) categories[d.category] = (categories[d.category] || 0) + 1;
            if (d.vendor) vendors[d.vendor] = (vendors[d.vendor] || 0) + 1;
        });

        // Simulamos obtener la latencia desde el estado en memoria para el promedio
        // Ya que la latencia no está en base de datos de los online, 
        // pero la DB tiene category y status. 
        // Mejor retornamos los conteos para que el frontend los reciba fidedignamente.
        
        const hourly = new Array(24).fill(0);
        hourlyData.forEach(row => {
            const h = parseInt(row.hour, 10);
            if (!isNaN(h)) hourly[h] = row.count;
        });

        res.json({
            kpis: {
                total: devices.length,
                online,
                offline,
                untrusted
            },
            categories,
            vendors,
            hourly_connections: hourly
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ────────────── API Configuración Router ──────────────
const fs = require('fs');

app.get('/api/settings/router', async (req, res) => {
    try {
        const passPath = path.join(__dirname, 'password');
        let pass = '';
        if (fs.existsSync(passPath)) {
            pass = fs.readFileSync(passPath, 'utf8').trim();
        }
        const dbPass = await db.getSetting('router_pass');
        res.json({ user: 'admin', pass: dbPass || pass });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/settings/router', async (req, res) => {
    try {
        const { user, pass } = req.body;
        const passPath = path.join(__dirname, 'password');
        fs.writeFileSync(passPath, pass);
        console.log(`[Router] Guardando credenciales de router ZTE. User: ${user}`);
        res.json({ ok: true, message: 'Credenciales guardadas' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ────────────── API Enrutador Proxy (Nginx) ──────────────
app.post('/api/proxy/add', async (req, res) => {
    try {
        const { domain, port } = req.body;
        if (!domain || !port) return res.status(400).json({ ok: false, error: 'Dominio y puerto requeridos' });
        
        // Escribir el fichero en /home/tosito/nexus/nginx_proxies/
        const fs = require('fs');
        const path = require('path');
        const { exec } = require('child_process');
        
        const localDomain = domain.includes('.') ? domain.replace(/\.[^.]+$/, '.local') : `${domain}.local`;
        
        const confContent = `server {
    listen 80;
    server_name ${domain} ${localDomain};
    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}`;
        
        const dir = path.join(__dirname, '..', 'nginx_proxies');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        fs.writeFileSync(path.join(dir, `${domain}.conf`), confContent);
        
        // Recargar Nginx usando sudo
        exec('sudo /usr/bin/systemctl reload nginx', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error recargando Nginx: ${error.message}`);
                return res.status(500).json({ ok: false, error: 'Error al recargar Nginx' });
            }
            res.json({ ok: true, message: 'Enrutamiento creado y Nginx recargado' });
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ────────────── API Seguridad Activa ──────────────
app.post('/api/security/block', async (req, res) => {
    try {
        const { ip, mac } = req.body;
        if (!mac) return res.status(400).json({ ok: false, error: 'MAC requerida' });
        
        await routerControl.blockMac(mac);
        await db.updateBlockStatus(ip, true);
        io.emit('device_blocked', { ip, mac });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/security/unblock', async (req, res) => {
    try {
        const { ip, mac } = req.body;
        if (!mac) return res.status(400).json({ ok: false, error: 'MAC requerida' });
        
        await routerControl.unblockMac(mac);
        await db.updateBlockStatus(ip, false);
        io.emit('device_unblocked', { ip, mac });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ────────────── API DNS Personalizado ──────────────
app.get('/api/dns/custom', async (req, res) => {
    try {
        const records = await db.getCustomDns();
        res.json({ ok: true, data: records });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/dns/custom', async (req, res) => {
    try {
        const { domain, ip } = req.body;
        if (!domain || !ip) return res.status(400).json({ ok: false, error: 'Dominio y IP requeridos' });
        await db.addCustomDns(domain, ip);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.delete('/api/dns/custom/:domain', async (req, res) => {
    try {
        await db.deleteCustomDns(req.params.domain);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ────────────── API Acceso Remoto (Tailscale) ──────────────
app.get('/api/tunnel', async (req, res) => {
    try {
        const status = await tunnelControl.getStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ active: false, error: err.message });
    }
});

// ────────────── WebSocket (con auth) ──────────────
io.use(auth.wrap(auth.sessionMiddleware));
io.use(auth.requireSocketAuth);

io.on('connection', async (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Enviar estado actual de dispositivos de forma instantánea
    const currentDevices = getCurrentDevices();
    socket.emit('initial_devices', currentDevices);

    // Enviar logs recientes al conectarse
    const logs = await db.getLogs(30).catch(() => []);
    socket.emit('recent_logs', logs);

    // Renombrar dispositivo
    socket.on('rename_device', async ({ ip, name }) => {
        try {
            await db.updateCustomName(ip, name);
            io.emit('device_renamed', { ip, name });
        } catch (err) {
            socket.emit('notification', { type: 'error', message: 'Error al renombrar' });
        }
    });

    // Actualizar categoría
    socket.on('set_category', async ({ ip, category }) => {
        try {
            await db.updateCategory(ip, category);
            io.emit('category_updated', { ip, category });
        } catch (err) {
            socket.emit('notification', { type: 'error', message: 'Error al actualizar categoría' });
        }
    });

    // Confiar en dispositivo (marcar como conocido)
    socket.on('trust_device', async (ip) => {
        try {
            await db.trustDevice(ip);
            io.emit('device_trusted', { ip });
        } catch (err) {
            socket.emit('notification', { type: 'error', message: 'Error' });
        }
    });

    // Wake on LAN
    socket.on('wake_device', async (mac) => {
        try {
            await wakeDevice(mac);
            socket.emit('notification', { type: 'success', message: `✅ Magic Packet enviado a ${mac}` });
        } catch (err) {
            socket.emit('notification', { type: 'error', message: `❌ Error WoL: ${err.message}` });
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// ────────────── Escaneo de red ──────────────
function handleSecurityAlert(type, ip, device) {
    const name = (device && device.custom_name) || ip;
    if (type === 'new_device') {
        const macInfo = (device && device.mac) ? `\nMAC: <code>${device.mac}</code>` : '';
        const osInfo = (device && device.os) ? `\nOS: <code>${device.os}</code>` : '';
        const msg = `🚨 <b>Nuevo dispositivo desconocido</b>\n\nIP: <code>${ip}</code>${macInfo}${osInfo}\n⏰ ${new Date().toLocaleString()}`;
        
        io.emit('security_alert', { type: 'new_device', ip, message: `Nuevo dispositivo desconocido detectado: ${ip}` });
        sendAlert('Nuevo dispositivo desconocido', `Se detectó un nuevo dispositivo en la red: <strong>${ip}</strong>`);
        sendTelegramAlert(msg, device);
    } else if (type === 'disconnect') {
        const msg = `⚡ <b>Dispositivo desconectado</b>\n\nNombre: <b>${name}</b>\nIP: <code>${ip}</code>\n⏰ ${new Date().toLocaleString()}`;
        io.emit('security_alert', { type: 'disconnect', ip, message: `${name} se ha desconectado` });
        sendAlert('Dispositivo desconectado', `El dispositivo <strong>${name} (${ip})</strong> se ha desconectado de la red.`);
        sendTelegramAlert(msg);
    }
}

// ════════════════════════════════════════════════
// API: Router ZTE — Control Avanzado
// ════════════════════════════════════════════════

// Helper: obtener contraseña del router (desde request o desde BD)
async function getRouterPass(req) {
    return req.body?.router_pass ||
           req.query?.router_pass ||
           await db.getSetting('router_pass') || '';
}

// Guardar contraseña del router
app.post('/api/router/auth', async (req, res) => {
    try {
        const { router_user, router_pass } = req.body;
        if (router_user) await db.setSetting('router_user', router_user);
        if (router_pass) await db.setSetting('router_pass', router_pass);
        // Probar la conexión
        const pass = router_pass || await db.getSetting('router_pass');
        const result = await zte.testConnection(pass);
        res.json(result);
    } catch (e) {
        res.json({ reachable: false, error: e.message });
    }
});

// Test de conectividad al router
app.get('/api/router/test', async (req, res) => {
    try {
        const pass = await getRouterPass(req);
        const result = await zte.testConnection(pass);
        res.json(result);
    } catch (e) {
        res.json({ reachable: false, error: e.message });
    }
});

// Clientes Wi-Fi reales del router
app.get('/api/router/clients', async (req, res) => {
    try {
        const pass = await getRouterPass(req);
        const clients = await zte.getWifiClients(pass);
        res.json({ ok: true, clients });
    } catch (e) {
        res.json({ ok: false, error: e.message, clients: [] });
    }
});

// Bloquear MAC en el router
app.post('/api/router/block', async (req, res) => {
    try {
        const { mac } = req.body;
        if (!mac) return res.json({ ok: false, error: 'MAC requerida' });
        const pass = await getRouterPass(req);
        const result = await zte.blockMac(mac, pass);
        if (result.success) io.emit('router_event', { type: 'block', mac });
        res.json({ ok: result.success, ...result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// Desbloquear MAC
app.post('/api/router/unblock', async (req, res) => {
    try {
        const { mac } = req.body;
        if (!mac) return res.json({ ok: false, error: 'MAC requerida' });
        const pass = await getRouterPass(req);
        const result = await zte.unblockMac(mac, pass);
        if (result.success) io.emit('router_event', { type: 'unblock', mac });
        res.json({ ok: result.success, ...result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// MACs bloqueadas actualmente
app.get('/api/router/blocked', async (req, res) => {
    try {
        const pass = await getRouterPass(req);
        const macs = await zte.getBlockedMacs(pass);
        res.json({ ok: true, macs });
    } catch (e) {
        res.json({ ok: false, macs: [], error: e.message });
    }
});

// Control Wi-Fi (encender/apagar)
app.post('/api/router/wifi', async (req, res) => {
    try {
        const { enable, band = 'all' } = req.body;
        const pass = await getRouterPass(req);
        const result = await zte.setWifiState(enable, band, pass);
        if (result.success) io.emit('router_event', { type: 'wifi', enable, band });
        res.json({ ok: result.success, ...result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// Estado Wi-Fi
app.get('/api/router/wifi', async (req, res) => {
    try {
        const pass = await getRouterPass(req);
        const status = await zte.getWifiStatus(pass);
        res.json({ ok: true, ...status });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// QoS — Limitar velocidad
app.post('/api/router/qos', async (req, res) => {
    try {
        const { mac, downMbps = 0, upMbps = 0 } = req.body;
        if (!mac) return res.json({ ok: false, error: 'MAC requerida' });
        const pass = await getRouterPass(req);
        const result = (downMbps === 0 && upMbps === 0)
            ? await zte.removeQoS(mac, pass)
            : await zte.setQoS(mac, downMbps, upMbps, pass);
        res.json({ ok: result.success, ...result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// Port Forwarding — Listar reglas
app.get('/api/router/portforward', async (req, res) => {
    try {
        const pass = await getRouterPass(req);
        const rules = await zte.getPortForwarding(pass);
        res.json({ ok: true, rules });
    } catch (e) {
        res.json({ ok: false, rules: [], error: e.message });
    }
});

// Port Forwarding — Añadir regla
app.post('/api/router/portforward', async (req, res) => {
    try {
        const pass = await getRouterPass(req);
        const result = await zte.addPortForwarding(req.body, pass);
        res.json({ ok: result.success, ...result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// Port Forwarding — Eliminar regla
app.delete('/api/router/portforward/:index', async (req, res) => {
    try {
        const pass = await getRouterPass(req);
        const result = await zte.deletePortForwarding(parseInt(req.params.index), pass);
        res.json({ ok: result.success, ...result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// Reiniciar router
app.post('/api/router/reboot', async (req, res) => {
    try {
        const pass = await getRouterPass(req);
        const result = await zte.reboot(pass);
        if (result.success) io.emit('router_event', { type: 'reboot' });
        res.json({ ok: result.success, ...result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// Estadísticas de tráfico del router
app.get('/api/router/stats', async (req, res) => {
    try {
        const pass = await getRouterPass(req);
        const stats = await zte.getTrafficStats(pass);
        res.json({ ok: true, ...stats });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

startScanning(
    (device) => io.emit('device_update', device),
    handleSecurityAlert
);

// ────────────── Monitor de tráfico ──────────────
startTrafficMonitor((stats) => {
    io.emit('traffic_update', stats);
});

server.listen(PORT, () => {
    console.log(`📡 Servidor Web corriendo en http://localhost:${PORT}`);
    // Iniciar servidor DNS
    startDnsServer(db, io);
    // Iniciar Bot de Telegram
    const { refreshBot } = require('./telegram');
    refreshBot();
    // Iniciar Motor AdBlock
    const adblock = require('./adblock');
    adblock.init();
    console.log(`🔐 Contraseña inicial: admin`);
});
