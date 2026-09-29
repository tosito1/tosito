const { spawn } = require('child_process');

// Catálogo de hash modes más usados en pentesting
const hashModes = [
    { mode: 0,    name: 'MD5',               example: '8743b52063cd84097a65d1633f5c74f5' },
    { mode: 10,   name: 'md5($pass.$salt)',   example: '01dfae6e5d4d90d9892622325959afbe:7050461' },
    { mode: 20,   name: 'md5($salt.$pass)',   example: 'f0fda58630310a6dd91a7d8f0a4ceda2:4225637426' },
    { mode: 100,  name: 'SHA1',              example: 'b89eaac7e61417341b710b727768294d0e6a277b' },
    { mode: 1000, name: 'NTLM',             example: 'b4b9b02e6f09a9bd760f388b67351e2b' },
    { mode: 1400, name: 'SHA-256',          example: '127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935' },
    { mode: 1700, name: 'SHA-512',          example: '82a9dda829eb7f8ffe9fbe49e45d47d2dad9664fbb7adf72492e3c81ebd3e29134d9bc12212bf83c6840f10e8246b9db54a4859b7ccd0123d86e5872c1e5082f7' },
    { mode: 1800, name: 'sha512crypt',      example: '$6$52450745$k5ka2p8bFuSmoVT1tzOyyuaREkkKBcCNqoDKzYiJL9RaE8yMnPgh2XzvTvNV7xJROfu' },
    { mode: 3000, name: 'LM',              example: '299bd128c1101fd6' },
    { mode: 3200, name: 'bcrypt',           example: '$2a$05$LhayLxezLhK1LhWvKxCyLOj0j1u.Kj0jZ0pEmm134uzrQlFvQJLF6' },
    { mode: 5500, name: 'NetNTLMv1',       example: 'u4-netntlm::kNS:338d08f8e26de93300000000000000000000000000000000:...' },
    { mode: 5600, name: 'NetNTLMv2',       example: 'admin::N46iSNekpT:08ca45b7d7ea58ee:...' },
    { mode: 13100, name: 'Kerberoast TGS', example: '$krb5tgs$23$*...' },
    { mode: 22000, name: 'WPA-PBKDF2-PMKID+EAPOL', example: 'WPA handshake (HCCAPX)' },
];

/**
 * Ejecuta Hashcat con streaming de salida en tiempo real.
 * @param {string} hashfilePath - Ruta al archivo de hashes
 * @param {string|null} wordlistPath - Wordlist (attack 0) o null para brute-force
 * @param {string|number} mode - Hash mode (ej: 0=MD5, 1000=NTLM)
 * @param {string|number} attackMode - 0=dict, 1=combinator, 3=brute-force/mask, 6=hybrid
 * @param {string|null} mask - Máscara para ataque 3 (ej: "?a?a?a?a?a?a?a?a")
 * @param {string|null} rules - Archivo de reglas (ej: "/usr/share/hashcat/rules/best64.rule")
 * @param {Function} onLine - Callback por cada línea
 * @param {Function} onDone - Callback al finalizar (code: number)
 */
function crack(hashfilePath, wordlistPath, mode, attackMode, mask, rules, onLine, onDone) {
    const m = mode || 0;
    const a = attackMode || 0;

    const args = [
        '-m', m.toString(),
        '-a', a.toString(),
        '--force',            // Forzar en entornos virtualizados/sin GPU dedicada
        '--status',           // Mostrar status periódicamente
        '--status-timer=5',   // Cada 5 segundos
        '-o', `${hashfilePath}.cracked`, // Output file
        hashfilePath,
    ];

    if (a == 0 && wordlistPath) {
        args.push(wordlistPath);
    } else if (a == 3 && mask) {
        args.push(mask);
    } else if (a == 0 && !wordlistPath) {
        args.push('/usr/share/wordlists/rockyou.txt'); // Fallback a rockyou
    }

    if (rules) {
        args.push('-r', rules);
    }

    onLine(`$ hashcat ${args.join(' ')}`);

    const proc = spawn('hashcat', args, { shell: false });
    let buffer = '';

    proc.stdout.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();
        lines.forEach(line => {
            if (line.trim()) onLine(line);
        });
    });

    proc.stderr.on('data', (data) => {
        data.toString().split('\n').forEach(line => {
            if (line.trim()) onLine(`[STDERR] ${line}`);
        });
    });

    proc.on('close', (code) => {
        if (buffer.trim()) onLine(buffer);
        if (code === 1) {
            onLine('[Hashcat] Sin nuevos hashes crackeados en esta sesión (el resultado puede estar en el potfile)');
        }
        onLine(`\n[Hashcat] Proceso terminado con código ${code}`);
        onDone(code);
    });

    proc.on('error', (err) => {
        onLine(`[ERROR] No se pudo ejecutar hashcat: ${err.message}`);
        onLine('[HINT] Asegúrate de que Hashcat está instalado: sudo apt install hashcat');
        onDone(1);
    });
}

module.exports = { crack, hashModes };
