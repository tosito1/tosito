const { spawn } = require('child_process');

// Plantillas predefinidas de scan
const templates = [
    { id: 'quick', name: 'Quick Scan', flags: '-T4 -F', description: 'Escaneo rápido de puertos comunes' },
    { id: 'service', name: 'Service Detection', flags: '-sV -T4', description: 'Detección de versiones de servicios' },
    { id: 'os', name: 'OS Detection', flags: '-O -T4', description: 'Detección del sistema operativo' },
    { id: 'full', name: 'Full Scan', flags: '-sV -O -A -T4', description: 'Scan completo con scripts NSE' },
    { id: 'stealth', name: 'Stealth SYN', flags: '-sS -T2', description: 'Scan SYN sigiloso (requiere root)' },
    { id: 'udp', name: 'UDP Scan', flags: '-sU -T4 --top-ports 100', description: 'Top 100 puertos UDP' },
    { id: 'vuln', name: 'Vuln Scripts', flags: '--script vuln -T4', description: 'Scripts NSE de vulnerabilidades' },
    { id: 'allports', name: 'All Ports', flags: '-p- -T4', description: 'Escaneo de todos los puertos (65535)' },
];

/**
 * Ejecuta un escaneo nmap con streaming de salida línea a línea.
 * @param {string} target - IP, rango CIDR o hostname
 * @param {string} flags  - Flags nmap (ej: "-sV -O -T4")
 * @param {Function} onLine - Callback (line: string) por cada línea de salida
 * @param {Function} onDone - Callback (code: number) al finalizar
 */
function scan(target, flags, onLine, onDone) {
    // Validación básica del target para evitar inyección de comandos
    if (!isValidTarget(target)) {
        onLine('[ERROR] Target inválido. Usa una IP, rango CIDR o hostname.');
        onDone(1);
        return;
    }

    // Parsear flags de forma segura (split por espacios)
    const flagsArray = flags.trim().split(/\s+/).filter(Boolean);
    const args = [...flagsArray, target];

    onLine(`$ nmap ${args.join(' ')}`);

    const proc = spawn('nmap', args, { shell: false });
    let buffer = '';

    proc.stdout.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Guardar fragmento incompleto
        lines.forEach(line => {
            if (line.trim()) onLine(line);
        });
    });

    proc.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) onLine(`[STDERR] ${line}`);
        });
    });

    proc.on('close', (code) => {
        if (buffer.trim()) onLine(buffer);
        onLine(`\n[nmap] Proceso terminado con código ${code}`);
        onDone(code);
    });

    proc.on('error', (err) => {
        onLine(`[ERROR] No se pudo ejecutar nmap: ${err.message}`);
        onLine('[HINT] Asegúrate de que nmap está instalado: sudo apt install nmap');
        onDone(1);
    });
}

/**
 * Valida que el target sea una IP, rango CIDR, hostname o rango de puertos.
 * Previene command injection básico.
 */
function isValidTarget(target) {
    // Permite: IPs, CIDRs, hostnames, rangos IP (192.168.1.1-255)
    return /^[a-zA-Z0-9.\-_/:\[\]]+$/.test(target);
}

module.exports = { scan, templates };
