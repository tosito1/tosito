const net = require('net');

const VULN_PORTS = [
    { port: 21, service: 'FTP', risk: 'Alto', desc: 'Transferencia de archivos sin cifrar' },
    { port: 22, service: 'SSH', risk: 'Medio', desc: 'Acceso remoto a consola' },
    { port: 23, service: 'Telnet', risk: 'Alto', desc: 'Consola sin cifrar' },
    { port: 25, service: 'SMTP', risk: 'Medio', desc: 'Servidor de correo' },
    { port: 53, service: 'DNS', risk: 'Bajo', desc: 'Resolución de nombres' },
    { port: 80, service: 'HTTP', risk: 'Medio', desc: 'Web sin cifrar (potencial panel expuesto)' },
    { port: 110, service: 'POP3', risk: 'Medio', desc: 'Correo entrante sin cifrar' },
    { port: 139, service: 'NetBIOS', risk: 'Alto', desc: 'Compartición de archivos Windows antigua' },
    { port: 143, service: 'IMAP', risk: 'Medio', desc: 'Correo entrante' },
    { port: 443, service: 'HTTPS', risk: 'Bajo', desc: 'Web cifrada' },
    { port: 445, service: 'SMB', risk: 'Alto', desc: 'Compartición de archivos Windows (Riesgo Ransomware)' },
    { port: 3306, service: 'MySQL', risk: 'Alto', desc: 'Base de datos expuesta' },
    { port: 3389, service: 'RDP', risk: 'Alto', desc: 'Escritorio remoto Windows' },
    { port: 5432, service: 'PostgreSQL', risk: 'Alto', desc: 'Base de datos expuesta' },
    { port: 5900, service: 'VNC', risk: 'Alto', desc: 'Escritorio remoto' },
    { port: 8080, service: 'HTTP-Alt', risk: 'Medio', desc: 'Web alternativa / Panel de control' },
    { port: 8443, service: 'HTTPS-Alt', risk: 'Bajo', desc: 'Web alternativa cifrada' },
    { port: 9000, service: 'Portainer/Sonar', risk: 'Medio', desc: 'Herramienta de desarrollo expuesta' }
];

async function checkPort(ip, portInfo) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        
        socket.on('connect', () => {
            socket.destroy();
            resolve({ ...portInfo, open: true });
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve({ ...portInfo, open: false });
        });
        
        socket.on('error', () => {
            resolve({ ...portInfo, open: false });
        });
        
        socket.connect(portInfo.port, ip);
    });
}

async function runAudit(ip) {
    console.log(`Auditoría de seguridad iniciada para ${ip}`);
    const results = [];
    
    // Escaneo en paralelo para mayor velocidad
    const promises = VULN_PORTS.map(p => checkPort(ip, p));
    const allScans = await Promise.all(promises);
    
    const openPorts = allScans.filter(s => s.open);
    
    let totalRiskScore = 0;
    openPorts.forEach(p => {
        if (p.risk === 'Alto') totalRiskScore += 3;
        else if (p.risk === 'Medio') totalRiskScore += 2;
        else totalRiskScore += 1;
    });

    let riskLevel = 'Bajo';
    if (totalRiskScore >= 5) riskLevel = 'Crítico';
    else if (totalRiskScore >= 3) riskLevel = 'Alto';
    else if (totalRiskScore >= 1) riskLevel = 'Medio';

    return {
        ip,
        timestamp: new Date().toISOString(),
        openPorts,
        riskLevel,
        score: totalRiskScore,
        summary: openPorts.length === 0 
            ? 'El dispositivo parece seguro y no expone servicios comunes.'
            : `El dispositivo tiene ${openPorts.length} puerto(s) abierto(s).`
    };
}

module.exports = { runAudit };
