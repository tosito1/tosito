const { spawn } = require('child_process');
const path = require('path');

/**
 * Lanza John the Ripper sobre un archivo de hashes.
 * @param {string} hashfilePath - Ruta al archivo de hashes
 * @param {string|null} wordlistPath - Ruta a la wordlist (null = modo incremental)
 * @param {string|null} format - Formato de hash (ej: "md5", "sha256", "NT", "bcrypt")
 * @param {Function} onLine - Callback por cada línea de salida
 * @param {Function} onDone - Callback al finalizar (code: number)
 */
function crack(hashfilePath, wordlistPath, format, onLine, onDone) {
    const args = [];

    if (wordlistPath) {
        args.push(`--wordlist=${wordlistPath}`);
    } else {
        args.push('--incremental');
    }

    if (format) {
        args.push(`--format=${format}`);
    }

    args.push(hashfilePath);

    onLine(`$ john ${args.join(' ')}`);

    const proc = spawn('john', args, { shell: false });
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
        // John imprime progreso en stderr
        data.toString().split('\n').forEach(line => {
            if (line.trim()) onLine(line);
        });
    });

    proc.on('close', (code) => {
        if (buffer.trim()) onLine(buffer);
        onLine(`\n[John] Proceso terminado con código ${code}`);
        onDone(code);
    });

    proc.on('error', (err) => {
        onLine(`[ERROR] No se pudo ejecutar john: ${err.message}`);
        onLine('[HINT] Asegúrate de que John the Ripper está instalado: sudo apt install john');
        onDone(1);
    });
}

/**
 * Muestra las contraseñas ya crackeadas en el pot file de John.
 * @param {string} hashfilePath
 * @param {string|null} format
 * @param {Function} callback - Callback (results: [{hash, password}])
 */
function show(hashfilePath, format, callback) {
    const args = ['--show'];
    if (format) args.push(`--format=${format}`);
    args.push(hashfilePath);

    const proc = spawn('john', args, { shell: false });
    let output = '';
    proc.stdout.on('data', d => output += d.toString());
    proc.on('close', () => {
        const results = [];
        output.split('\n').forEach(line => {
            const match = line.match(/^(.+?):(.+?):.*$/);
            if (match) {
                results.push({ hash: match[1], password: match[2] });
            }
        });
        callback(results);
    });
    proc.on('error', () => callback([]));
}

module.exports = { crack, show };
