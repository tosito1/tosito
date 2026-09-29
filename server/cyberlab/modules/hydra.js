const { spawn } = require('child_process');

/**
 * Hydra — Brute force de credenciales en servicios de red.
 * @param {string} target - IP o hostname
 * @param {string} service - ssh | ftp | http-get | http-post-form | smb | rdp | mysql | ...
 * @param {object} options - { username, userlist, password, passlist, port, threads, stopOnFirst, verbose, outputFile, httpFormPath, httpFormParams }
 * @param {Function} onLine
 * @param {Function} onDone
 */
function attack(target, service, options = {}, onLine, onDone) {
    const args = [];

    // Usuarios
    if (options.username)  args.push('-l', options.username);
    else if (options.userlist) args.push('-L', options.userlist);
    else args.push('-l', 'admin');

    // Contraseñas
    if (options.password)  args.push('-p', options.password);
    else if (options.passlist) args.push('-P', options.passlist);
    else args.push('-P', '/usr/share/wordlists/rockyou.txt');

    // Opciones generales
    args.push('-t', String(options.threads || 16));  // tareas paralelas
    if (options.stopOnFirst) args.push('-f');          // parar al encontrar primera
    if (options.verbose)     args.push('-V');
    if (options.port)        args.push('-s', String(options.port));
    if (options.outputFile)  args.push('-o', options.outputFile);

    args.push(target);

    // Servicio — puede necesitar parámetros extra (http-post-form)
    if (service === 'http-post-form' && options.httpFormPath && options.httpFormParams) {
        args.push(`http-post-form`);
        args.push(`${options.httpFormPath}:${options.httpFormParams}`);
    } else {
        args.push(service);
    }

    onLine(`$ hydra ${args.join(' ')}`);

    const proc = spawn('hydra', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => {
        buf += d.toString();
        const ls = buf.split('\n'); buf = ls.pop();
        ls.forEach(l => {
            if (!l.trim()) return;
            // Marcar credenciales encontradas
            if (l.includes('[') && l.includes('login:')) onLine(`[FOUND] ${l}`);
            else onLine(l);
        });
    });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(`[STDERR] ${l}`)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[Hydra] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine('[HINT] sudo apt install hydra'); onDone(1); });
}

const services = [
    { id: 'ssh',            name: 'SSH',            defaultPort: 22 },
    { id: 'ftp',            name: 'FTP',            defaultPort: 21 },
    { id: 'telnet',         name: 'Telnet',         defaultPort: 23 },
    { id: 'http-get',       name: 'HTTP GET Auth',  defaultPort: 80 },
    { id: 'http-post-form', name: 'HTTP POST Form', defaultPort: 80 },
    { id: 'https-get',      name: 'HTTPS GET Auth', defaultPort: 443 },
    { id: 'smb',            name: 'SMB',            defaultPort: 445 },
    { id: 'rdp',            name: 'RDP',            defaultPort: 3389 },
    { id: 'mysql',          name: 'MySQL',          defaultPort: 3306 },
    { id: 'postgres',       name: 'PostgreSQL',     defaultPort: 5432 },
    { id: 'vnc',            name: 'VNC',            defaultPort: 5900 },
    { id: 'imap',           name: 'IMAP',           defaultPort: 143 },
    { id: 'pop3',           name: 'POP3',           defaultPort: 110 },
    { id: 'smtp',           name: 'SMTP',           defaultPort: 25 },
    { id: 'ldap2',          name: 'LDAP',           defaultPort: 389 },
];

module.exports = { attack, services };
