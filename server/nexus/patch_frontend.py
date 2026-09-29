import paramiko, os

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"
FRONTEND = "/home/tosito/nexus/frontend"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

# ── Read current index.html ───────────────────────────────────────────────────
print("[1] Reading index.html...")
with sftp.file(FRONTEND + "/index.html", "r") as f:
    html = f.read().decode("utf-8", errors="replace")

# ── Find the nav tabs and last tab-content ────────────────────────────────────
# Add new tab button in nav
tools_nav_btn = """
                <button class="tab-btn" data-tab="tools" onclick="switchTab('tools')">
                    <span class="tab-icon">🛠️</span>
                    <span>Herramientas</span>
                </button>"""

# Find a tab button to insert after (after "Seguridad" or last tab)
# Let's find the pattern of a tab button
import re
# Find the last tab-btn and insert after it
last_tab_match = re.search(r'(data-tab="[^"]+"\s+onclick="switchTab\(\'[^\']+\'\)">[^<]+</span>\s+</button>)(?![\s\S]*data-tab=)', html)
if last_tab_match and "tools" not in html:
    insert_pos = last_tab_match.end()
    html = html[:insert_pos] + tools_nav_btn + html[insert_pos:]
    print("  Nav button added")

# ── New tab content ───────────────────────────────────────────────────────────
tools_tab_html = """
        <!-- ═══ TAB: Herramientas ═══ -->
        <div id="tab-tools" class="tab-content" style="display:none">
            <!-- Sub-nav -->
            <div class="sub-nav" style="display:flex;gap:8px;margin-bottom:1.5rem;flex-wrap:wrap;">
                <button class="sub-tab-btn active" data-sub="nmap" onclick="switchSubTab('nmap',this)">🔍 nmap</button>
                <button class="sub-tab-btn" data-sub="arp" onclick="switchSubTab('arp',this)">📡 ARP Scan</button>
                <button class="sub-tab-btn" data-sub="msf" onclick="switchSubTab('msf',this)">🛡️ Metasploit</button>
                <button class="sub-tab-btn" data-sub="history" onclick="switchSubTab('history',this)">📊 Historial</button>
            </div>

            <!-- nmap sub-panel -->
            <div id="sub-nmap" class="sub-panel">
                <div class="section-header"><h2>🔍 Escáner nmap</h2></div>
                <div class="tools-form" style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:1rem;align-items:flex-end;">
                    <div>
                        <label style="display:block;font-size:0.8rem;color:var(--muted);margin-bottom:4px;">Target (IP o subred)</label>
                        <input id="nmap-target" class="form-control" value="192.168.1.0/24" placeholder="192.168.1.1 o 192.168.1.0/24" style="min-width:220px;">
                    </div>
                    <div>
                        <label style="display:block;font-size:0.8rem;color:var(--muted);margin-bottom:4px;">Modo</label>
                        <select id="nmap-mode" style="background:var(--bg2);border:1px solid var(--border2);color:var(--text);padding:0.5rem 0.75rem;border-radius:8px;font-family:inherit;font-size:0.9rem;">
                            <option value="quick">Quick (top 100 puertos)</option>
                            <option value="deep">Deep (todos los puertos + OS)</option>
                            <option value="vuln">Scripts de Vulnerabilidad</option>
                            <option value="ping">Ping Scan (hosts activos)</option>
                        </select>
                    </div>
                    <button class="action-btn" onclick="runNmap()" id="nmap-btn">▶ Ejecutar</button>
                    <button class="action-btn" style="background:rgba(255,255,255,0.05);" onclick="exportNmapResult()">⬇ Exportar JSON</button>
                </div>
                <div id="nmap-status" style="font-size:0.85rem;color:var(--muted);margin-bottom:0.5rem;"></div>
                <div id="nmap-result" style="font-family:monospace;font-size:0.78rem;background:rgba(0,0,0,0.3);border-radius:10px;padding:1rem;max-height:420px;overflow-y:auto;white-space:pre-wrap;color:#a3e635;display:none;"></div>
                <div id="nmap-table" style="margin-top:1rem;display:none;">
                    <h3 style="font-size:0.9rem;margin-bottom:0.5rem;color:var(--muted);">Puertos abiertos</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:0.82rem;" id="nmap-ports-table">
                        <thead><tr style="color:var(--muted);text-align:left;border-bottom:1px solid var(--border2);">
                            <th style="padding:6px 10px;">Puerto</th>
                            <th style="padding:6px 10px;">Proto</th>
                            <th style="padding:6px 10px;">Servicio</th>
                            <th style="padding:6px 10px;">Versión</th>
                            <th style="padding:6px 10px;">Riesgo</th>
                        </tr></thead>
                        <tbody id="nmap-ports-body"></tbody>
                    </table>
                </div>
            </div>

            <!-- arp-scan sub-panel -->
            <div id="sub-arp" class="sub-panel" style="display:none;">
                <div class="section-header"><h2>📡 ARP Scan</h2></div>
                <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">Detecta todos los dispositivos en la red local mediante ARP. Más rápido y fiable que ping.</p>
                <div style="display:flex;gap:12px;align-items:center;margin-bottom:1rem;">
                    <input id="arp-subnet" class="form-control" value="192.168.1.0/24" placeholder="192.168.1.0/24" style="max-width:220px;">
                    <button class="action-btn" onclick="runArpScan()" id="arp-btn">📡 Escanear red</button>
                </div>
                <div id="arp-status" style="font-size:0.85rem;color:var(--muted);margin-bottom:0.5rem;"></div>
                <div id="arp-result" class="devices-grid" style="margin-top:1rem;"></div>
            </div>

            <!-- MSF sub-panel -->
            <div id="sub-msf" class="sub-panel" style="display:none;">
                <div class="section-header"><h2>🛡️ Metasploit — Auditoría de Vulnerabilidades</h2></div>
                <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">Módulos <code>auxiliary/scanner</code> — solo detección, sin explotación activa. Para auditar tu propia red.</p>
                <div class="tools-form" style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:1rem;align-items:flex-end;">
                    <div>
                        <label style="display:block;font-size:0.8rem;color:var(--muted);margin-bottom:4px;">Módulo</label>
                        <select id="msf-module" style="background:var(--bg2);border:1px solid var(--border2);color:var(--text);padding:0.5rem 0.75rem;border-radius:8px;font-family:inherit;font-size:0.9rem;min-width:280px;" onchange="updateMsfInfo()">
                            <option value="">Cargando módulos...</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.8rem;color:var(--muted);margin-bottom:4px;">RHOSTS (target)</label>
                        <input id="msf-rhosts" class="form-control" value="192.168.1.0/24" placeholder="192.168.1.1 o subred" style="min-width:220px;">
                    </div>
                    <button class="action-btn" onclick="runMsf()" id="msf-btn">▶ Lanzar</button>
                </div>
                <div id="msf-info" style="font-size:0.82rem;color:var(--muted);margin-bottom:0.75rem;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px;display:none;"></div>
                <div id="msf-status" style="font-size:0.85rem;color:var(--muted);margin-bottom:0.5rem;"></div>
                <div id="msf-result" style="display:none;">
                    <div id="msf-summary" style="padding:12px 16px;border-radius:10px;margin-bottom:1rem;font-weight:500;"></div>
                    <div id="msf-raw" style="font-family:monospace;font-size:0.75rem;background:rgba(0,0,0,0.3);border-radius:10px;padding:1rem;max-height:380px;overflow-y:auto;white-space:pre-wrap;color:#94a3b8;"></div>
                </div>
            </div>

            <!-- History sub-panel -->
            <div id="sub-history" class="sub-panel" style="display:none;">
                <div class="section-header"><h2>📊 Historial de auditorías</h2></div>
                <div id="tools-history-table" style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
                        <thead><tr style="color:var(--muted);text-align:left;border-bottom:1px solid var(--border2);">
                            <th style="padding:8px 12px;">#</th>
                            <th style="padding:8px 12px;">Herramienta</th>
                            <th style="padding:8px 12px;">Target</th>
                            <th style="padding:8px 12px;">Modo</th>
                            <th style="padding:8px 12px;">Resumen</th>
                            <th style="padding:8px 12px;">Fecha</th>
                        </tr></thead>
                        <tbody id="tools-history-body">
                            <tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted);">Sin resultados aún</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>"""

# Find where to insert (before closing </main> or last </div> that closes content)
# Insert before the last occurrence of </main>
if "tab-tools" not in html:
    # Find last tab-content closing and insert after it
    insert_marker = "<!-- end tab-content -->"
    if insert_marker in html:
        html = html.replace(insert_marker, tools_tab_html + "\n" + insert_marker)
    else:
        # Fallback: insert before </main>
        html = html.replace("</main>", tools_tab_html + "\n</main>", 1)
    print("  Tools tab added to index.html")

with sftp.file(FRONTEND + "/index.html", "w") as f:
    f.write(html)
print("  index.html saved")

# ── Read current app.js ───────────────────────────────────────────────────────
print("[2] Reading app.js...")
with sftp.file(FRONTEND + "/app.js", "r") as f:
    js = f.read().decode("utf-8", errors="replace")

tools_js = """

// ════════════════════════════════════════════════════════════
// HERRAMIENTAS: nmap · arp-scan · Metasploit
// ════════════════════════════════════════════════════════════

let lastNmapResult = null;

// Sub-tab navigation
function switchSubTab(name, btn) {
    document.querySelectorAll(".sub-panel").forEach(p => p.style.display = "none");
    document.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
    const panel = document.getElementById("sub-" + name);
    if (panel) panel.style.display = "";
    if (btn) btn.classList.add("active");
    if (name === "history") loadToolsHistory();
    if (name === "msf") loadMsfModules();
}

// ── nmap ────────────────────────────────────────────────────
const HIGH_RISK_PORTS = [21, 23, 445, 139, 3306, 3389, 5900, 5432];
const MED_RISK_PORTS  = [22, 25, 80, 110, 143, 8080, 9000];

function portRisk(port) {
    if (HIGH_RISK_PORTS.includes(port)) return {label:"Alto", color:"#ef4444"};
    if (MED_RISK_PORTS.includes(port)) return {label:"Medio", color:"#f59e0b"};
    return {label:"Bajo", color:"#22c55e"};
}

async function runNmap() {
    const target = document.getElementById("nmap-target").value.trim();
    const mode = document.getElementById("nmap-mode").value;
    if (!target) return;
    const btn = document.getElementById("nmap-btn");
    btn.disabled = true; btn.textContent = "⏳ Escaneando...";
    document.getElementById("nmap-status").textContent = "Escaneando " + target + " en modo " + mode + "... (puede tardar 1-3 min)";
    document.getElementById("nmap-result").style.display = "none";
    document.getElementById("nmap-table").style.display = "none";

    try {
        const res = await fetch("/api/tools/nmap", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ target, mode })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        lastNmapResult = data.result;
        const raw = data.result.raw;
        const parsed = data.result.parsed;

        document.getElementById("nmap-result").style.display = "";
        document.getElementById("nmap-result").textContent = raw;
        document.getElementById("nmap-status").textContent =
            "Completado — " + parsed.ports.length + " puertos abiertos encontrados" +
            (parsed.os ? " · OS: " + parsed.os : "");

        // Build ports table
        if (parsed.ports.length > 0) {
            document.getElementById("nmap-table").style.display = "";
            const tbody = document.getElementById("nmap-ports-body");
            tbody.innerHTML = parsed.ports.map(p => {
                const risk = portRisk(p.port);
                return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                    <td style="padding:6px 10px;font-weight:600;color:#60a5fa;">${p.port}</td>
                    <td style="padding:6px 10px;color:var(--muted);">${p.protocol}</td>
                    <td style="padding:6px 10px;">${p.service}</td>
                    <td style="padding:6px 10px;color:var(--muted);font-size:0.78rem;">${p.version || "—"}</td>
                    <td style="padding:6px 10px;"><span style="background:${risk.color}22;color:${risk.color};padding:2px 8px;border-radius:99px;font-size:0.75rem;">${risk.label}</span></td>
                </tr>`;
            }).join("");
        }
    } catch (e) {
        document.getElementById("nmap-status").textContent = "Error: " + e.message;
    } finally {
        btn.disabled = false; btn.textContent = "▶ Ejecutar";
    }
}

function exportNmapResult() {
    if (!lastNmapResult) return alert("Realiza un escaneo primero");
    const blob = new Blob([JSON.stringify(lastNmapResult, null, 2)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nmap_" + lastNmapResult.target + "_" + Date.now() + ".json";
    a.click();
}

// ── arp-scan ────────────────────────────────────────────────
async function runArpScan() {
    const subnet = document.getElementById("arp-subnet").value.trim();
    const btn = document.getElementById("arp-btn");
    btn.disabled = true; btn.textContent = "⏳ Escaneando...";
    document.getElementById("arp-status").textContent = "Ejecutando arp-scan en " + subnet + "...";
    document.getElementById("arp-result").innerHTML = "";

    try {
        const res = await fetch("/api/tools/arp?subnet=" + encodeURIComponent(subnet));
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        const devs = data.result.parsed.devices;
        document.getElementById("arp-status").textContent =
            devs.length + " dispositivos encontrados vía ARP";

        document.getElementById("arp-result").innerHTML = devs.map(d => `
            <div class="device-card" style="cursor:default;">
                <div class="card-top">
                    <div style="font-size:1.4rem;">📡</div>
                    <div class="card-status status-on"></div>
                </div>
                <div class="device-name">${d.ip}</div>
                <div class="device-meta" style="font-family:monospace;">${d.mac}</div>
                ${d.vendor ? `<div class="device-meta">${d.vendor}</div>` : ""}
            </div>
        `).join("");
    } catch (e) {
        document.getElementById("arp-status").textContent = "Error: " + e.message;
    } finally {
        btn.disabled = false; btn.textContent = "📡 Escanear red";
    }
}

// ── Metasploit ──────────────────────────────────────────────
let msfModules = [];

async function loadMsfModules() {
    if (msfModules.length) return;
    try {
        const res = await fetch("/api/tools/msf/modules");
        const data = await res.json();
        if (!data.ok) return;
        msfModules = data.modules;
        const sel = document.getElementById("msf-module");
        // Group by category
        const cats = {};
        data.modules.forEach(m => { (cats[m.category] = cats[m.category] || []).push(m); });
        sel.innerHTML = Object.entries(cats).map(([cat, mods]) =>
            `<optgroup label="${cat}">${mods.map(m =>
                `<option value="${m.id}">${m.name}</option>`
            ).join("")}</optgroup>`
        ).join("");
        updateMsfInfo();
    } catch (e) { console.error("loadMsfModules", e); }
}

function updateMsfInfo() {
    const id = document.getElementById("msf-module").value;
    const mod = msfModules.find(m => m.id === id);
    const el = document.getElementById("msf-info");
    if (mod) {
        el.style.display = "";
        el.innerHTML = `<code style="color:#a78bfa;">${mod.module}</code>`;
    } else { el.style.display = "none"; }
}

async function runMsf() {
    const moduleId = document.getElementById("msf-module").value;
    const rhosts = document.getElementById("msf-rhosts").value.trim();
    if (!moduleId || !rhosts) return;

    const btn = document.getElementById("msf-btn");
    btn.disabled = true; btn.textContent = "⏳ Ejecutando...";
    document.getElementById("msf-status").textContent =
        "Ejecutando módulo Metasploit contra " + rhosts + "... (puede tardar 1-3 min)";
    document.getElementById("msf-result").style.display = "none";

    try {
        const res = await fetch("/api/tools/msf", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ moduleId, rhosts })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        const result = data.result;
        document.getElementById("msf-result").style.display = "";
        const isVuln = result.parsed.isVulnerable;
        document.getElementById("msf-summary").innerHTML = isVuln
            ? `<span style="color:#ef4444;">⚠️ ${result.parsed.summary}</span>`
            : `<span style="color:#22c55e;">✅ ${result.parsed.summary}</span>`;
        document.getElementById("msf-summary").style.background =
            isVuln ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";
        document.getElementById("msf-raw").textContent = result.raw;
        document.getElementById("msf-status").textContent = "Completado — " + result.moduleName;
    } catch (e) {
        document.getElementById("msf-status").textContent = "Error: " + e.message;
    } finally {
        btn.disabled = false; btn.textContent = "▶ Lanzar";
    }
}

// ── Historial ───────────────────────────────────────────────
async function loadToolsHistory() {
    try {
        const res = await fetch("/api/tools/results");
        const data = await res.json();
        if (!data.ok) return;
        const tbody = document.getElementById("tools-history-body");
        if (!data.results.length) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;padding:2rem;color:var(--muted);'>Sin resultados aún</td></tr>";
            return;
        }
        const toolIcons = { nmap:"🔍", "arp-scan":"📡", metasploit:"🛡️" };
        tbody.innerHTML = data.results.map(r => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:8px 12px;color:var(--muted);">${r.id}</td>
                <td style="padding:8px 12px;">${toolIcons[r.tool]||"🔧"} ${r.tool}</td>
                <td style="padding:8px 12px;font-family:monospace;font-size:0.8rem;">${r.target}</td>
                <td style="padding:8px 12px;color:var(--muted);">${r.mode}</td>
                <td style="padding:8px 12px;font-size:0.8rem;">${r.summary || "—"}</td>
                <td style="padding:8px 12px;color:var(--muted);font-size:0.78rem;">${new Date(r.timestamp).toLocaleString()}</td>
            </tr>
        `).join("");
    } catch (e) { console.error("loadToolsHistory", e); }
}

// ── CSS for sub-nav ─────────────────────────────────────────
(function addToolsStyles() {
    const style = document.createElement("style");
    style.textContent = `
        .sub-tab-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: var(--muted);
            padding: 6px 14px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.85rem;
            font-family: inherit;
            transition: all 200ms;
        }
        .sub-tab-btn:hover { background: rgba(255,255,255,0.1); color: var(--text); }
        .sub-tab-btn.active { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.4); color: #a5b4fc; }
        #nmap-result { scrollbar-width: thin; }
        #msf-raw { scrollbar-width: thin; }
    `;
    document.head.appendChild(style);
})();
"""

if "runNmap" not in js:
    js = js + tools_js
    with sftp.file(FRONTEND + "/app.js", "w") as f:
        f.write(js)
    print("  app.js patched with tools logic")
else:
    print("  app.js already has tools logic")

sftp.close()
c.close()
print("FRONTEND PATCH DONE")