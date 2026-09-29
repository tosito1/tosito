import paramiko, re

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

# --- 1. Patch tools.js ---
with sftp.file("/home/tosito/nexus/backend/tools.js", "r") as f:
    tools_code = f.read().decode("utf-8", errors="replace")

# Add new functions before module.exports
new_functions = """
// ── Wake-on-LAN ────────────────────────────────────────────────────────────────
async function wakeOnLan(mac) {
    if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac)) throw new Error("Invalid MAC address");
    const cmd = `wakeonlan ${mac} 2>&1`;
    console.log(`[wol] Running: ${cmd}`);
    const { stdout, exitCode } = await execPromise(cmd, 10000);
    return { success: exitCode === 0, raw: stdout, mac };
}

// ── iperf3 ──────────────────────────────────────────────────────────────────────
async function iperf3Test(target) {
    if (!/^[\w./:-]+$/.test(target)) throw new Error("Invalid target");
    const cmd = `iperf3 -c ${target} -t 5 -J 2>&1`;
    console.log(`[iperf3] Running: ${cmd}`);
    const { stdout, exitCode } = await execPromise(cmd, 30000);
    
    let parsed = null;
    try {
        parsed = JSON.parse(stdout);
    } catch (e) {
        parsed = { error: "Failed to parse JSON", raw: stdout };
    }
    
    const result = {
        tool: "iperf3",
        target,
        mode: "speedtest",
        timestamp: new Date().toISOString(),
        raw: stdout,
        parsed,
        exitCode,
    };
    await saveToolResult(result);
    return result;
}

// ── OSINT / DNS Lookup (Whois) ──────────────────────────────────────────────────
async function osintLookup(target) {
    if (!/^[\w.-]+$/.test(target)) throw new Error("Invalid target");
    const cmd = `whois ${target} 2>&1`;
    console.log(`[osint] Running: ${cmd}`);
    const { stdout, exitCode } = await execPromise(cmd, 20000);
    
    const result = {
        tool: "osint",
        target,
        mode: "whois",
        timestamp: new Date().toISOString(),
        raw: stdout,
        parsed: { summary: `Whois lookup for ${target}` },
        exitCode,
    };
    await saveToolResult(result);
    return result;
}
"""

if "wakeOnLan" not in tools_code:
    tools_code = tools_code.replace("module.exports = {", new_functions + "\nmodule.exports = {\n    wakeOnLan,\n    iperf3Test,\n    osintLookup,")
    with sftp.file("/home/tosito/nexus/backend/tools.js", "w") as f:
        f.write(tools_code)
    print("Patched tools.js")

# --- 2. Patch server.js ---
with sftp.file("/home/tosito/nexus/backend/server.js", "r") as f:
    server_code = f.read().decode("utf-8", errors="replace")

new_endpoints = """
// Wake-on-LAN
app.post('/api/tools/wol', auth.requireAuth, async (req, res) => {
    try {
        const { mac } = req.body;
        if (!mac) return res.json({ ok: false, error: 'MAC requerida' });
        const result = await tools.wakeOnLan(mac);
        res.json({ ok: true, result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// iperf3
app.post('/api/tools/iperf3', auth.requireAuth, async (req, res) => {
    try {
        const { target } = req.body;
        if (!target) return res.json({ ok: false, error: 'Target requerido' });
        const result = await tools.iperf3Test(target);
        res.json({ ok: true, result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// OSINT (Whois)
app.post('/api/tools/osint', auth.requireAuth, async (req, res) => {
    try {
        const { target } = req.body;
        if (!target) return res.json({ ok: false, error: 'Target requerido' });
        const result = await tools.osintLookup(target);
        res.json({ ok: true, result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});
"""

if "/api/tools/wol" not in server_code:
    # Insert right before "// Tool results history"
    server_code = server_code.replace("// Tool results history", new_endpoints + "\n// Tool results history")
    with sftp.file("/home/tosito/nexus/backend/server.js", "w") as f:
        f.write(server_code)
    print("Patched server.js")

sftp.close()
c.close()