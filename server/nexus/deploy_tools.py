"""
Deploy tools integration to Ubuntu Nexus backend + frontend
"""
import paramiko, time, os

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"
BACKEND = "/home/tosito/nexus/backend"
FRONTEND = "/home/tosito/nexus/frontend"
LOCAL = os.path.dirname(os.path.abspath(__file__))

def run(c, cmd, sudo=False, timeout=30):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print("  " + out[:400])
    if err:
        f = [l for l in err.splitlines() if "password" not in l.lower() and "contrase" not in l.lower() and "authenticate" not in l.lower()]
        if f: print("  [err]", "\n".join(f[:3]))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

# ── 1. Upload tools.js ───────────────────────────────────────────────────────
print("[1] Uploading tools.js...")
sftp.put(os.path.join(LOCAL, "tools.js"), BACKEND + "/tools.js")

# ── 2. Patch database.js — add saveToolResult and getToolResults ──────────────
print("[2] Patching database.js...")
with sftp.file(BACKEND + "/database.js", "r") as f:
    db_content = f.read().decode("utf-8", errors="replace")

# New functions to add before module.exports
new_db_funcs = """
// ── Tool Results ──────────────────────────────────────────────────────────────
function initToolResultsTable() {
    db.run(`CREATE TABLE IF NOT EXISTS tool_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool TEXT,
        target TEXT,
        mode TEXT,
        summary TEXT,
        raw TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
}
initToolResultsTable();

function saveToolResult({ tool, target, mode, summary, raw, timestamp }) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO tool_results (tool, target, mode, summary, raw, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
            [tool, target, mode, summary || "", raw || "", timestamp || new Date().toISOString()],
            function(err) { if (err) reject(err); else resolve(this.lastID); }
        );
    });
}

function getToolResults(limit = 50) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT id, tool, target, mode, summary, timestamp FROM tool_results ORDER BY id DESC LIMIT ?`,
            [limit],
            (err, rows) => { if (err) reject(err); else resolve(rows || []); }
        );
    });
}

function getToolResultById(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM tool_results WHERE id = ?`, [id], (err, row) => {
            if (err) reject(err); else resolve(row);
        });
    });
}

"""

# Insert before module.exports
exports_line = "module.exports = {"
if "saveToolResult" not in db_content:
    db_content = db_content.replace(exports_line, new_db_funcs + exports_line)
    # Also update exports
    old_exports_end = "    getAdblockStats, incrementAdblockCount\n};"
    new_exports_end = "    getAdblockStats, incrementAdblockCount,\n    saveToolResult, getToolResults, getToolResultById\n};"
    db_content = db_content.replace(old_exports_end, new_exports_end)
    with sftp.file(BACKEND + "/database.js", "w") as f:
        f.write(db_content)
    print("  database.js patched")
else:
    print("  database.js already has tool functions")

# ── 3. Patch server.js — add require and new endpoints ───────────────────────
print("[3] Patching server.js...")
with sftp.file(BACKEND + "/server.js", "r") as f:
    sv_content = f.read().decode("utf-8", errors="replace")

# Add require for tools
tools_require = "const tools = require('./tools');\n"
if "require('./tools')" not in sv_content:
    # Add after the last require line (after zte line)
    sv_content = sv_content.replace(
        "const zte = require('./zte_router');",
        "const zte = require('./zte_router');\n" + tools_require
    )

# Add new API endpoints before startScanning(...)
new_endpoints = """
// ════════════════════════════════════════════════
// API: Herramientas Avanzadas (nmap, arp-scan, Metasploit)
// ════════════════════════════════════════════════

// nmap scan
app.post('/api/tools/nmap', auth.requireAuth, async (req, res) => {
    try {
        const { target, mode = 'quick' } = req.body;
        if (!target) return res.json({ ok: false, error: 'Target requerido' });
        // Sanitize target
        if (!/^[\\w./:,-]+$/.test(target)) return res.json({ ok: false, error: 'Target inválido' });
        const result = await tools.nmapScan(target, mode);
        res.json({ ok: true, result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// arp-scan
app.get('/api/tools/arp', auth.requireAuth, async (req, res) => {
    try {
        const subnet = req.query.subnet || '192.168.1.0/24';
        const result = await tools.arpScan(subnet);
        res.json({ ok: true, result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// MSF available modules
app.get('/api/tools/msf/modules', auth.requireAuth, (req, res) => {
    res.json({ ok: true, modules: tools.MSF_MODULES });
});

// MSF scan
app.post('/api/tools/msf', auth.requireAuth, async (req, res) => {
    try {
        const { moduleId, rhosts } = req.body;
        if (!moduleId || !rhosts) return res.json({ ok: false, error: 'moduleId y rhosts requeridos' });
        if (!/^[\\w./:,-]+$/.test(rhosts)) return res.json({ ok: false, error: 'rhosts inválido' });
        const result = await tools.msfScan(moduleId, rhosts);
        res.json({ ok: true, result });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// Tool results history
app.get('/api/tools/results', auth.requireAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const results = await tools.getToolResults(limit);
        res.json({ ok: true, results });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

// Tool result detail
app.get('/api/tools/results/:id', auth.requireAuth, async (req, res) => {
    try {
        const row = await db.getToolResultById(parseInt(req.params.id));
        if (!row) return res.json({ ok: false, error: 'No encontrado' });
        res.json({ ok: true, result: row });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});

"""

if "/api/tools/nmap" not in sv_content:
    sv_content = sv_content.replace("startScanning(", new_endpoints + "startScanning(")
    with sftp.file(BACKEND + "/server.js", "w") as f:
        f.write(sv_content)
    print("  server.js patched with tools endpoints")
else:
    print("  server.js already has tools endpoints")

sftp.close()

# ── 4. Restart nexus-node ─────────────────────────────────────────────────────
print("[4] Restarting nexus-node...")
run(c, "systemctl restart nexus-node", sudo=True)
time.sleep(6)
status = run(c, "systemctl is-active nexus-node")
print("  Status:", status)
if "active" not in status:
    print(run(c, "journalctl -u nexus-node -n 15 --no-pager"))

print("[5] Testing new endpoints...")
run(c, "curl -s http://127.0.0.1:3000/api/tools/msf/modules | head -5")

c.close()
print("DEPLOY DONE")