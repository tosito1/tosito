const { spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');

/**
 * BloodHound — bloodhound-python: recolección de datos Active Directory.
 * Genera JSON/ZIP para importar en BloodHound GUI (Community Edition o CE).
 * @param {string} domain - Dominio AD (ej: corp.local)
 * @param {string} dc     - IP o hostname del Domain Controller
 * @param {object} options - { username, password, hash, method, collection, outputDir, dns, kerberos }
 * @param {Function} onLine
 * @param {Function} onDone
 */
function collect(domain, dc, options = {}, onLine, onDone) {
    const outputDir = options.outputDir || '/tmp/bloodhound';

    // Crear directorio de salida
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const args = [
        '-d', domain,
        '-dc', dc,
        '-o', outputDir,
        '-c', options.collection || 'All',  // All, DCOnly, Session, ACL, etc.
        '--zip',                              // comprimir en ZIP
    ];

    // Autenticación
    if (options.username) args.push('-u', options.username);
    if (options.password) args.push('-p', options.password);
    if (options.hash)     args.push('--hashes', options.hash);
    if (options.kerberos) args.push('-k');
    if (options.dns)      args.push('--dns-tcp');

    // Método de recolección
    const method = options.method || 'auto'; // auto, ldap, rpc
    if (method !== 'auto') args.push('--auth-method', method);

    // Opciones adicionales
    if (options.noSessions) args.push('--exclude-dcs');
    if (options.throttle)   args.push('--throttle', String(options.throttle));
    if (options.jitter)     args.push('--jitter',   String(options.jitter));

    onLine(`$ bloodhound-python ${args.join(' ')}`);
    onLine(`[INFO] Recolectando datos de AD en ${domain} (DC: ${dc})`);
    onLine(`[INFO] Output → ${outputDir}/`);
    onLine(`[INFO] Los archivos ZIP generados se importan en BloodHound GUI: File → Import Data`);

    const proc = spawn('bloodhound-python', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (!l.trim()) return;
            let line = l;
            if (/INFO/i.test(l))    line = `[INFO] ${l}`;
            if (/WARNING/i.test(l)) line = `[WARN] ${l}`;
            if (/ERROR/i.test(l))   line = `[ERR] ${l}`;
            if (/Done/i.test(l))    line = `[✓] ${l}`;
            onLine(line);
        });
    });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(l)));
    proc.on('close', code => {
        if (buf.trim()) onLine(buf);
        if (code === 0) {
            onLine('\n[✓] Recolección completada');
            onLine(`[✓] Archivos ZIP en: ${outputDir}/`);
            onLine('[→] Importa los ZIP en BloodHound GUI: Upload Data → select *.zip');
        }
        onLine(`\n[BloodHound-Python] Exit: ${code}`);
        onDone(code);
    });
    proc.on('error', err => {
        onLine(`[ERROR] ${err.message}`);
        onLine('[HINT] pip install bloodhound  →  instala bloodhound-python');
        onDone(1);
    });
}

/** Lista los archivos ZIP generados en el directorio de output. */
function listOutputFiles(outputDir) {
    const dir = outputDir || '/tmp/bloodhound';
    try {
        return fs.readdirSync(dir)
            .filter(f => f.endsWith('.zip') || f.endsWith('.json'))
            .map(f => ({ name: f, path: path.join(dir, f), size: fs.statSync(path.join(dir, f)).size }));
    } catch { return []; }
}

// Métodos de recolección
const collectionMethods = [
    { id: 'All',       name: 'All',         desc: 'Todo (Users, Groups, Sessions, ACLs, GPOs, Trusts)' },
    { id: 'DCOnly',    name: 'DC Only',      desc: 'Solo objetos del DC (más silencioso)' },
    { id: 'Session',   name: 'Sessions',     desc: 'Sesiones activas de usuarios' },
    { id: 'ACL',       name: 'ACLs',         desc: 'Access Control Lists' },
    { id: 'Group',     name: 'Groups',       desc: 'Miembros de grupos' },
    { id: 'Trusts',    name: 'Trusts',       desc: 'Relaciones de confianza entre dominios' },
    { id: 'Container', name: 'Containers',   desc: 'Contenedores y OUs' },
    { id: 'ObjectProps','name': 'Properties', desc: 'Propiedades de objetos' },
    { id: 'Default',   name: 'Default',      desc: 'Group + LocalAdmin + Session + Trusts' },
];

module.exports = { collect, listOutputFiles, collectionMethods };
