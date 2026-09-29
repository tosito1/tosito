const { spawn } = require('child_process');

/**
 * enum4linux — Enumeración SMB/Samba (usuarios, grupos, shares, políticas).
 */
function enumerate(target, options = {}, onLine, onDone) {
    const args = [];

    if (options.all)      args.push('-a');   // todo (recomendado)
    if (options.users)    args.push('-U');
    if (options.groups)   args.push('-G');
    if (options.shares)   args.push('-S');
    if (options.password) args.push('-P');   // políticas de contraseña
    if (options.rid)      args.push('-r');   // RID cycling
    if (options.os)       args.push('-o');   // info OS
    if (options.nmblookup)args.push('-n');
    if (options.verbose)  args.push('-v');
    if (options.username) args.push('-u', options.username);
    if (options.pass)     args.push('-p', options.pass);

    if (args.length === 0) args.push('-a');  // default: todo

    args.push(target);

    onLine(`$ enum4linux ${args.join(' ')}`);

    const proc = spawn('enum4linux', args, { shell: false });
    let buf = '';
    proc.stdout.on('data', d => { buf += d.toString(); const ls = buf.split('\n'); buf = ls.pop(); ls.forEach(l => l.trim() && onLine(l)); });
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && onLine(l)));
    proc.on('close', code => { if (buf.trim()) onLine(buf); onLine(`\n[enum4linux] Exit: ${code}`); onDone(code); });
    proc.on('error', err => { onLine(`[ERROR] ${err.message}`); onLine('[HINT] sudo apt install enum4linux'); onDone(1); });
}

module.exports = { enumerate };
