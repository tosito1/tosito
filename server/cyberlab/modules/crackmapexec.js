const { spawn } = require('child_process');

/**
 * CrackMapExec — Enumeración y explotación de redes Windows/Active Directory/SMB.
 */
function run(protocol, target, options = {}, onLine, onDone) {
    const args = [protocol, target];

    // Credenciales
    if (options.username) args.push('-u', options.username);
    if (options.password) args.push('-p', options.password);
    if (options.hash)     args.push('-H', options.hash);     // Pass-the-Hash
    if (options.domain)   args.push('-d', options.domain);
    if (options.nullAuth) args.push('--no-bruteforce', '-u', '', '-p', '');

    // Módulos / acciones
    if (options.shares)        args.push('--shares');
    if (options.users)         args.push('--users');
    if (options.groups)        args.push('--groups');
    if (options.loggedon)      args.push('--loggedon-users');
    if (options.sessions)      args.push('--sessions');
    if (options.disks)         args.push('--disks');
    if (options.rid)           args.push('--rid-brute');
    if (options.sam)           args.push('--sam');           // dump SAM
    if (options.lsa)           args.push('--lsa');           // dump LSA
    if (options.ntds)          args.push('--ntds');          // dump NTDS (DC)
    if (options.command)       args.push('-x', options.command);    // exec cmd
    if (options.psCommand)     args.push('-X', options.psCommand);  // exec PS
    if (options.spider)        args.push('--spider', options.spider);
    if (options.module)        args.push('-M', options.module);
    if (options.threads)       args.push('--threads', String(options.threads || 100));

    onLine(`$ crackmapexec ${args.join(' ')}`);

    const proc = spawn('crackmapexec', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (!l.trim()) return;
            let line = l;
            if (l.includes('[+]')) line = `[SUCCESS] ${l}`;
            else if (l.includes('[-]')) line = `[FAIL] ${l}`;
            else if (l.includes('[*]')) line = `[INFO] ${l}`;
            onLine(line);
        });
    });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(`[ERR] ${l}`)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[CME] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine('[HINT] pip install crackmapexec  o  apt install crackmapexec'); onDone(1); });
}

const protocols = [
    { id: 'smb',  name: 'SMB',           desc: 'Windows File Sharing / Active Directory' },
    { id: 'ssh',  name: 'SSH',           desc: 'Secure Shell' },
    { id: 'winrm',name: 'WinRM',         desc: 'Windows Remote Management' },
    { id: 'ldap', name: 'LDAP',          desc: 'Active Directory LDAP' },
    { id: 'mssql',name: 'MSSQL',         desc: 'Microsoft SQL Server' },
    { id: 'rdp',  name: 'RDP',           desc: 'Remote Desktop Protocol' },
    { id: 'ftp',  name: 'FTP',           desc: 'File Transfer Protocol' },
];

module.exports = { run, protocols };
