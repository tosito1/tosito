const { spawn } = require('child_process');

/**
 * NetExec (nxc) — Sucesor de CrackMapExec.
 * Más rápido, más protocolos, mantenimiento activo.
 */
function run(protocol, target, options = {}, onLine, onDone) {
    const args = [protocol, target];

    // Credenciales
    if (options.username) args.push('-u', options.username);
    if (options.password) args.push('-p', options.password);
    if (options.hash)     args.push('-H', options.hash);      // Pass-the-Hash
    if (options.domain)   args.push('-d', options.domain);
    if (options.kerberos) args.push('-k');                    // Kerberos auth
    if (options.nullAuth) { args.push('-u', ''); args.push('-p', ''); }
    if (options.aesKey)   args.push('--aesKey', options.aesKey);

    // Acciones SMB
    if (options.shares)   args.push('--shares');
    if (options.users)    args.push('--users');
    if (options.groups)   args.push('--groups');
    if (options.computers)args.push('--computers');
    if (options.loggedon) args.push('--loggedon-users');
    if (options.sessions) args.push('--sessions');
    if (options.disks)    args.push('--disks');
    if (options.rid)      args.push('--rid-brute');
    if (options.sam)      args.push('--sam');
    if (options.lsa)      args.push('--lsa');
    if (options.ntds)     args.push('--ntds');
    if (options.dpapi)    args.push('--dpapi');        // DPAPI secrets
    if (options.laps)     args.push('--laps');         // LAPS passwords
    if (options.gmsa)     args.push('--gmsa');         // GMSA accounts
    if (options.command)  args.push('-x', options.command);
    if (options.psCommand)args.push('-X', options.psCommand);
    if (options.module)   { args.push('-M', options.module); if (options.moduleOptions) args.push('-o', options.moduleOptions); }
    if (options.spider)   args.push('--spider', options.spider);
    if (options.threads)  args.push('--threads', String(options.threads || 100));
    if (options.verbose)  args.push('-v');
    if (options.noOutput) args.push('--no-output');

    // LDAP specific
    if (options.trusted)  args.push('--trusted-for-delegation');
    if (options.adminCount) args.push('--admin-count');
    if (options.passwordNotRequired) args.push('--password-not-required');
    if (options.passwordNeverExpires) args.push('--password-never-expires');
    if (options.getUnixInfo) args.push('--get-unixInfo');

    onLine(`$ nxc ${args.join(' ')}`);

    const proc = spawn('nxc', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (!l.trim()) return;
            let line = l;
            if (l.includes('[+]'))       line = `[SUCCESS] ${l}`;
            else if (l.includes('[-]'))  line = `[FAIL] ${l}`;
            else if (l.includes('[*]'))  line = `[INFO] ${l}`;
            else if (l.includes('Pwn3d!')) line = `[🔥 PWNED] ${l}`;
            onLine(line);
        });
    });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(`[ERR] ${l}`)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[NetExec] Exit: ${code}`); onDone(code); });
    proc.on('error', err => {
        onLine(`[ERROR] ${err.message}`);
        onLine('[HINT] pip install netexec  o  apt install netexec  |  comando: nxc');
        onDone(1);
    });
}

const protocols = [
    { id: 'smb',    name: 'SMB',    desc: 'File Sharing / Active Directory' },
    { id: 'ssh',    name: 'SSH',    desc: 'Secure Shell' },
    { id: 'winrm',  name: 'WinRM',  desc: 'Windows Remote Management' },
    { id: 'ldap',   name: 'LDAP',   desc: 'Active Directory LDAP' },
    { id: 'mssql',  name: 'MSSQL',  desc: 'Microsoft SQL Server' },
    { id: 'rdp',    name: 'RDP',    desc: 'Remote Desktop Protocol' },
    { id: 'ftp',    name: 'FTP',    desc: 'File Transfer Protocol' },
    { id: 'vnc',    name: 'VNC',    desc: 'Virtual Network Computing' },
    { id: 'wmi',    name: 'WMI',    desc: 'Windows Management Instrumentation' },
];

// Módulos populares de NetExec
const popularModules = [
    { id: 'Mimikatz',     desc: 'Dump credenciales en memoria' },
    { id: 'lsassy',       desc: 'Dump LSASS sin Mimikatz' },
    { id: 'nanodump',     desc: 'Dump LSASS via nanodump' },
    { id: 'handlekatz',   desc: 'Dump LSASS handles' },
    { id: 'procdump',     desc: 'Dump proceso con procdump' },
    { id: 'web_delivery', desc: 'Payload delivery web' },
    { id: 'met_inject',   desc: 'Inyección Meterpreter' },
    { id: 'empire_exec',  desc: 'Ejecutar agente Empire' },
    { id: 'gpp_password', desc: 'Credenciales en GPP (Group Policy)' },
    { id: 'dfscoerce',    desc: 'DFSCoerce — forzar autenticación NTLM' },
    { id: 'printerbug',   desc: 'PrinterBug / SpoolSample' },
    { id: 'ms17-010',     desc: 'EternalBlue detection' },
    { id: 'zerologon',    desc: 'ZeroLogon check (CVE-2020-1472)' },
    { id: 'petitpotam',   desc: 'PetitPotam — forzar autenticación' },
    { id: 'rdp',          desc: 'Gestión RDP' },
];

module.exports = { run, protocols, popularModules };
