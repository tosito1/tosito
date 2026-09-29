const ping = require('ping');
const os = require('os');
const { exec } = require('child_process');
const net = require('net');
const dns = require('dns');
const db = require('./database');
const { lookupVendor } = require('./oui');

function getLocalIpPrefix() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal &&
                !iface.address.startsWith('169.254') &&
                !iface.address.startsWith('192.168.56')) {
                const parts = iface.address.split('.');
                return `${parts[0]}.${parts[1]}.${parts[2]}`;
            }
        }
    }
    return '192.168.1';
}

const prefix = getLocalIpPrefix();
console.log(`Subred detectada: ${prefix}.0/24`);

const devicesStatus = new Map();

function getMacFromArp(ip) {
    return new Promise((resolve) => {
        exec(`arp -a ${ip}`, (err, stdout) => {
            if (err) return resolve(null);
            const macMatch = stdout.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
            if (macMatch) {
                resolve(macMatch[0].replace(/-/g, ':').toLowerCase());
            } else {
                resolve(null);
            }
        });
    });
}

function resolveHostname(ip) {
    return new Promise((resolve) => {
        dns.reverse(ip, (err, hostnames) => {
            if (err || !hostnames || hostnames.length === 0) {
                resolve(null);
            } else {
                // Devolver solo el primer hostname limpio
                resolve(hostnames[0].replace(/\.$/, ''));
            }
        });
    });
}

function checkPort(port, host) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(800);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => resolve(false));
        socket.connect(port, host);
    });
}

function inferOS(ports, vendor, hostname) {
    let os = null;
    let category = null;

    if (ports.includes(3389) || ports.includes(445)) {
        os = 'Windows';
        category = 'pc';
    } else if (ports.includes(548)) {
        os = 'macOS';
        category = 'pc';
    } else if (ports.includes(62078)) {
        os = 'iOS';
        category = 'mobile';
    } else if (ports.includes(5555)) {
        os = 'Android';
        category = 'mobile';
    } else if (ports.includes(8009) || ports.includes(8008)) {
        os = 'Android TV';
        category = 'tv';
    } else if (ports.includes(22)) {
        os = 'Linux';
        category = 'server';
    }

    if (!os && vendor) {
        const v = vendor.toLowerCase();
        if (v.includes('apple')) {
            os = 'iOS/macOS';
            if (!category) category = 'mobile';
        } else if (v.includes('samsung') || v.includes('huawei') || v.includes('xiaomi') || v.includes('motorola')) {
            os = 'Android';
            if (!category) category = 'mobile';
        } else if (v.includes('nintendo') || v.includes('sony') || v.includes('microsoft')) {
            if (!category) category = 'iot';
        }
    }

    if (!os && hostname) {
        const h = hostname.toLowerCase();
        if (h.includes('iphone') || h.includes('ipad')) { os = 'iOS'; category = 'mobile'; }
        else if (h.includes('macbook') || h.includes('macmini') || h.includes('imac')) { os = 'macOS'; category = 'pc'; }
        else if (h.includes('android')) { os = 'Android'; category = 'mobile'; }
    }

    return { os, category };
}

async function scanDeviceDetails(ip, isOnline) {
    if (!isOnline) return { mac: null, ports: [], hostname: null, vendor: null, os: null, inferredCategory: null };
    
    const portsToScan = [21, 22, 23, 53, 80, 443, 445, 548, 3306, 3389, 5000, 5555, 8009, 8080, 9100, 62078];
    const portChecks = portsToScan.map(port => checkPort(port, ip));
    
    const [mac, hostname, ...portResults] = await Promise.all([
        getMacFromArp(ip),
        resolveHostname(ip),
        ...portChecks
    ]);

    const ports = [];
    portsToScan.forEach((port, index) => {
        if (portResults[index]) ports.push(port);
    });

    const vendor = lookupVendor(mac);
    const { os, category } = inferOS(ports, vendor, hostname);

    return { mac, ports, hostname, vendor, os, inferredCategory: category };
}

async function scanSubnet(callback, alertCallback) {
    const savedDevices = await db.getAllDevices().catch(() => []);
    const savedMap = new Map(savedDevices.map(d => [d.ip, d]));

    const promises = [];

    for (let i = 1; i <= 254; i++) {
        const host = `${prefix}.${i}`;

        const p = ping.promise.probe(host, { timeout: 2 }).then(async res => {
            const isOnline = res.alive;
            const latency = res.time !== 'unknown' ? parseFloat(res.time) : 0;
            const prevStatus = devicesStatus.get(host);
            const saved = savedMap.get(host);

            const stateChanged = prevStatus && prevStatus.isOnline !== isOnline;
            const isNew = !prevStatus && isOnline;

            if (isOnline) db.saveLatency(host, latency);

            if (isOnline || stateChanged) {
                const details = await scanDeviceDetails(host, isOnline);

                // Solo actualizar categoría si era unknown
                let finalCategory = (saved && saved.category) || 'unknown';
                if (finalCategory === 'unknown' && details.inferredCategory) {
                    finalCategory = details.inferredCategory;
                }

                const deviceData = {
                    ip: host,
                    isOnline,
                    time: latency,
                    mac: details.mac || (saved && saved.mac) || null,
                    ports: details.ports || [],
                    hostname: details.hostname || (saved && saved.hostname) || null,
                    vendor: details.vendor || (saved && saved.vendor) || null,
                    os: details.os || (saved && saved.os) || null,
                    customName: (saved && saved.custom_name) || null,
                    category: finalCategory,
                    isTrusted: saved ? !!saved.is_trusted : false,
                    lastSeen: isOnline ? Date.now() : (saved && saved.last_seen ? new Date(saved.last_seen).getTime() : null),
                    profile_id: (saved && saved.profile_id) || null,
                    isBlocked: (saved && saved.is_blocked) ? true : false
                };

                if (stateChanged) {
                    db.logEvent(host, isOnline ? 'connected' : 'disconnected');
                    if (!isOnline && alertCallback && saved && saved.is_trusted) {
                        alertCallback('disconnect', host, saved);
                    }
                } else if (isNew) {
                    db.logEvent(host, 'discovered');
                    if (alertCallback && !saved) {
                        alertCallback('new_device', host, deviceData);
                    }
                }

                devicesStatus.set(host, deviceData);

                if (deviceData.mac || isOnline) {
                    db.upsertDevice(deviceData).catch(err => console.error('DB Error:', err));
                }

                callback(deviceData);
            } else if (!isOnline && saved && !prevStatus) {
                // Mostrar dispositivos guardados que están offline
                const deviceData = {
                    ip: host,
                    isOnline: false,
                    time: 0,
                    mac: saved.mac,
                    ports: [],
                    hostname: saved.hostname,
                    vendor: saved.vendor,
                    os: saved.os,
                    customName: saved.custom_name,
                    category: saved.category || 'unknown',
                    isTrusted: !!saved.is_trusted,
                    lastSeen: saved.last_seen ? new Date(saved.last_seen).getTime() : null,
                    profile_id: saved.profile_id || null,
                    isBlocked: saved.is_blocked ? true : false
                };
                devicesStatus.set(host, deviceData);
                callback(deviceData);
            }
        }).catch(() => {});

        promises.push(p);
    }

    await Promise.all(promises);
}

function startScanning(callback, alertCallback) {
    console.log('Iniciando escaneo V3...');
    scanSubnet(callback, alertCallback);
    setInterval(() => scanSubnet(callback, alertCallback), 30000);
}

function getCurrentDevices() {
    return Array.from(devicesStatus.values());
}

module.exports = { startScanning, getCurrentDevices };
