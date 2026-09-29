const { spawn } = require('child_process');

/**
 * Ejecuta msfconsole con una serie de comandos y hace streaming de la salida.
 * @param {string[]} commands - Array de comandos MSF (ej: ["use exploit/...", "set RHOSTS ...", "run"])
 * @param {Function} onLine - Callback por cada línea de salida
 * @param {Function} onDone - Callback al finalizar (code: number)
 */
function runCommands(commands, onLine, onDone) {
    // Construir el recurso de comandos como script inline
    const scriptContent = commands.join('\n') + '\nexit -y\n';

    onLine(`$ msfconsole -q -x "${commands.join('; ')}"`);

    const proc = spawn('msfconsole', [
        '-q',          // Sin banner
        '-x', scriptContent.trim()
    ], { shell: false });

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
        onLine(`\n[Metasploit] Proceso terminado con código ${code}`);
        onDone(code);
    });

    proc.on('error', (err) => {
        onLine(`[ERROR] No se pudo ejecutar msfconsole: ${err.message}`);
        onLine('[HINT] Asegúrate de que Metasploit está instalado: https://metasploit.com/download');
        onDone(1);
    });
}

/**
 * Busca módulos de Metasploit por keyword.
 * Ejecuta `msfconsole -q -x "search <q>; exit"` y parsea la salida.
 */
function searchModules(query, callback) {
    const results = [];
    const proc = spawn('msfconsole', ['-q', '-x', `search ${query}; exit`], { shell: false });

    let output = '';
    proc.stdout.on('data', d => output += d.toString());
    proc.on('close', () => {
        // Parsear líneas de tabla de resultados
        const lines = output.split('\n');
        let inTable = false;
        lines.forEach(line => {
            if (line.match(/^\s+\d+\s+/)) {
                inTable = true;
                const parts = line.trim().split(/\s{2,}/);
                if (parts.length >= 4) {
                    results.push({
                        index: parts[0],
                        name: parts[1],
                        date: parts[2],
                        rank: parts[3],
                        description: parts[4] || ''
                    });
                }
            }
        });
        callback(results);
    });
    proc.on('error', () => callback([]));
}

module.exports = { runCommands, searchModules };
