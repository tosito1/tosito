const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'network.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS devices (
        ip TEXT PRIMARY KEY,
        mac TEXT,
        custom_name TEXT,
        vendor TEXT,
        hostname TEXT,
        os TEXT,
        ports TEXT,
        category TEXT DEFAULT 'unknown',
        is_trusted INTEGER DEFAULT 0,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME,
        profile_id INTEGER,
        is_blocked INTEGER DEFAULT 0
    )`);
    
    // Migración para bases de datos existentes
    db.run(`ALTER TABLE devices ADD COLUMN profile_id INTEGER`, (err) => {});
    db.run(`ALTER TABLE devices ADD COLUMN is_blocked INTEGER DEFAULT 0`, (err) => {});
    db.run(`ALTER TABLE devices ADD COLUMN os TEXT`, (err) => {});
    db.run(`ALTER TABLE devices ADD COLUMN ports TEXT`, (err) => {});

    db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        event_type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS security_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        event_type TEXT,
        ip TEXT,
        mac TEXT,
        custom_name TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        icon TEXT,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS dns_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip TEXT,
        domain TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS latency_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        latency REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS custom_dns (
        domain TEXT PRIMARY KEY,
        ip TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);

    // Migrar columnas nuevas si no existen (seguro de correr múltiples veces)
    db.run(`ALTER TABLE devices ADD COLUMN hostname TEXT`, () => {});
    db.run(`ALTER TABLE devices ADD COLUMN category TEXT DEFAULT 'unknown'`, () => {});
    db.run(`ALTER TABLE devices ADD COLUMN is_trusted INTEGER DEFAULT 0`, () => {});

    // Añadir columna profile_id a devices de forma segura si no existe
    db.all("PRAGMA table_info(devices)", (err, columns) => {
        if (!err && columns) {
            const hasProfileId = columns.some(c => c.name === 'profile_id');
            if (!hasProfileId) {
                db.run(`ALTER TABLE devices ADD COLUMN profile_id INTEGER REFERENCES profiles(id)`);
            }
        }
    });
});

function upsertDevice(device) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO devices (ip, mac, custom_name, vendor, hostname, os, ports, category, is_trusted, last_seen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ip) DO UPDATE SET
                mac = COALESCE(excluded.mac, mac),
                vendor = COALESCE(excluded.vendor, vendor),
                hostname = COALESCE(excluded.hostname, hostname),
                os = COALESCE(excluded.os, os),
                ports = COALESCE(excluded.ports, ports),
                last_seen = excluded.last_seen
        `;
        db.run(query, [
            device.ip,
            device.mac || null,
            device.customName || null,
            device.vendor || null,
            device.hostname || null,
            device.os || null,
            device.ports ? JSON.stringify(device.ports) : null,
            device.category || 'unknown',
            device.isTrusted ? 1 : 0,
            device.lastSeen ? new Date(device.lastSeen).toISOString() : null
        ], function(err) {
            if (err) reject(err); else resolve(this.changes);
        });
    });
}

function getAllDevices() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM devices`, (err, rows) => {
            if (err) return reject(err);
            rows.forEach(row => {
                if (row.ports) {
                    try { row.ports = JSON.parse(row.ports); } catch(e) { row.ports = []; }
                } else {
                    row.ports = [];
                }
            });
            resolve(rows);
        });
    });
}

function updateCustomName(ip, name) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE devices SET custom_name = ? WHERE ip = ?`, [name, ip], function(err) {
            if (err) reject(err); else resolve(this.changes);
        });
    });
}

function updateCategory(ip, category) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE devices SET category = ?, is_trusted = 1 WHERE ip = ?`, [category, ip], function(err) {
            if (err) reject(err); else resolve(this.changes);
        });
    });
}

function trustDevice(ip) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE devices SET is_trusted = 1 WHERE ip = ?`, [ip], function(err) {
            if (err) reject(err); else resolve(this.changes);
        });
    });
}

function logEvent(ip, eventType) {
    db.run(`INSERT INTO logs (ip, event_type) VALUES (?, ?)`, [ip, eventType]);
}

function getLogs(limit = 50) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT l.*, d.custom_name FROM logs l LEFT JOIN devices d ON l.ip = d.ip ORDER BY l.timestamp DESC LIMIT ?`,
            [limit],
            (err, rows) => { if (err) reject(err); else resolve(rows); }
        );
    });
}

function getHourlyConnections() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT strftime('%H', timestamp) as hour, COUNT(*) as count 
            FROM logs 
            WHERE timestamp >= datetime('now', '-24 hours') AND event_type = 'connected'
            GROUP BY hour
        `;
        db.all(query, (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
}

function saveLatency(ip, latency) {
    db.run(`INSERT INTO latency_history (ip, latency) VALUES (?, ?)`, [ip, latency]);
}

function getLatencyHistory(ip, hours = 6) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT latency, timestamp FROM latency_history WHERE ip = ? AND timestamp >= datetime('now', '-${hours} hours') ORDER BY timestamp ASC`,
            [ip],
            (err, rows) => { if (err) reject(err); else resolve(rows); }
        );
    });
}

function getSetting(key) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT value FROM settings WHERE key = ?`, [key], (err, row) => {
            if (err) reject(err); else resolve(row ? row.value : null);
        });
    });
}

function setSetting(key, value) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, value], function(err) {
            if (err) reject(err); else resolve(this.changes);
        });
    });
}

// ── DNS (V5) ──
function logDnsRequest(ip, domain) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO dns_logs (ip, domain) VALUES (?, ?)`, [ip, domain], err => {
            if (err) reject(err); else resolve();
        });
    });
}

function getDnsStats() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT domain, COUNT(*) as count 
            FROM dns_logs 
            WHERE timestamp >= datetime('now', '-24 hours')
            GROUP BY domain 
            ORDER BY count DESC 
            LIMIT 15
        `;
        db.all(query, (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
}

// ── Perfiles (V4) ──
function getProfiles() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM profiles ORDER BY name`, (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
}

function addProfile(name, icon, color) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO profiles (name, icon, color) VALUES (?, ?, ?)`, [name, icon, color], function(err) {
            if (err) reject(err); else resolve(this.lastID);
        });
    });
}

function assignProfile(ip, profileId) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE devices SET profile_id = ? WHERE ip = ?`, [profileId, ip], err => {
            if (err) reject(err); else resolve();
        });
    });
}

function updateBlockStatus(ip, isBlocked) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE devices SET is_blocked = ? WHERE ip = ?`, [isBlocked ? 1 : 0, ip], err => {
            if (err) reject(err); else resolve();
        });
    });
}

function getCustomDns() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT domain, ip FROM custom_dns ORDER BY created_at DESC`, [], (err, rows) => {
            if (err) reject(err); else resolve(rows || []);
        });
    });
}

function resolveCustomDns(domain) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT ip FROM custom_dns WHERE domain = ?`, [domain], (err, row) => {
            if (err) reject(err); else resolve(row ? row.ip : null);
        });
    });
}

function addCustomDns(domain, ip) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO custom_dns (domain, ip) VALUES (?, ?)`, [domain, ip], err => {
            if (err) reject(err); else resolve();
        });
    });
}

function deleteCustomDns(domain) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM custom_dns WHERE domain = ?`, [domain], err => {
            if (err) reject(err); else resolve();
        });
    });
}

function getAdblockStats() {
    return new Promise((resolve) => {
        db.get(`SELECT setting_value FROM settings WHERE setting_key = 'adblock_count'`, (err, row) => {
            const count = row ? parseInt(row.setting_value, 10) : 0;
            resolve(count);
        });
    });
}

function incrementAdblockCount() {
    return new Promise((resolve) => {
        db.run(`INSERT INTO settings (setting_key, setting_value) VALUES ('adblock_count', '1') 
                ON CONFLICT(setting_key) DO UPDATE SET setting_value = CAST((CAST(setting_value AS INTEGER) + 1) AS TEXT)`, () => resolve());
    });
}

module.exports = {
    upsertDevice, getAllDevices, updateCustomName, updateCategory, trustDevice,
    logEvent, getLogs, saveLatency, getLatencyHistory, getSetting, setSetting,
    getProfiles, addProfile, assignProfile,
    logDnsRequest, getDnsStats, getHourlyConnections, updateBlockStatus,
    getCustomDns, resolveCustomDns, addCustomDns, deleteCustomDns,
    getAdblockStats, incrementAdblockCount
};
