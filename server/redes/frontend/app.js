// ════════════════════════════════════════════════
// Nexus Network Controller V4 — Frontend Logic
// ════════════════════════════════════════════════

const socket = io();

// ── State ──
const devices = new Map();
const securityAlerts = [];
let logs = [];
let currentFilter = 'all';
let profiles = [];
let latencyChart = null;
let charts = { hourly: null, vendors: null };

// ── DOM refs ──
const devicesGrid    = document.getElementById('devices-grid');
const securityGrid   = document.getElementById('security-grid');
const alertsList     = document.getElementById('alerts-list');
const logTable       = document.getElementById('log-table');
const profilesGrid   = document.getElementById('profiles-grid');
const toastContainer = document.getElementById('toast-container');

// ════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Theme loading
    const savedTheme = localStorage.getItem('nexus_theme') || 'cyberpunk';
    document.body.dataset.theme = savedTheme;
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = savedTheme;
    
    // Load Speedtest initial state
    fetch('/api/speedtest').then(r=>r.json()).then(data => {
        if(data.status === 'success' || data.download) updateSpeedtestUI(data);
    });

    // Load Router Auth
    fetch('/api/settings/router').then(r=>r.json()).then(data => {
        if(data.pass) {
            const passInput = document.getElementById('router-pass');
            if(passInput) passInput.value = data.pass;
            
            const rtrPassInput = document.getElementById('rtr-pass');
            if(rtrPassInput) rtrPassInput.value = data.pass;
        }
    });

    loadCustomDns();
    loadAdblockStatus();
    loadTunnelStatus();
});

window.changeTheme = (theme) => {
    document.body.dataset.theme = theme;
    localStorage.setItem('nexus_theme', theme);
};

// ════════════════════════════════════════════════
// Socket Events
// ════════════════════════════════════════════════

socket.on('initial_devices', (deviceList) => {
    deviceList.forEach(device => devices.set(device.ip, device));
    renderAll();
});

socket.on('device_update', (device) => {
    devices.set(device.ip, device);
    renderAll();
});

socket.on('device_renamed', ({ ip, name }) => {
    if (devices.has(ip)) { devices.get(ip).customName = name; renderAll(); }
});

socket.on('category_updated', ({ ip, category }) => {
    if (devices.has(ip)) { devices.get(ip).category = category; devices.get(ip).isTrusted = true; renderAll(); }
});

socket.on('device_trusted', ({ ip }) => {
    if (devices.has(ip)) { devices.get(ip).isTrusted = true; renderAll(); }
});

socket.on('profile_assigned', ({ ip, profileId }) => {
    if (devices.has(ip)) { devices.get(ip).profile_id = profileId; renderAll(); }
});

socket.on('device_blocked', ({ ip }) => {
    if (devices.has(ip)) { devices.get(ip).isBlocked = true; renderAll(); }
});

socket.on('device_unblocked', ({ ip }) => {
    if (devices.has(ip)) { devices.get(ip).isBlocked = false; renderAll(); }
});

socket.on('recent_logs', (data) => {
    logs = data;
    renderLogs();
});

socket.on('traffic_update', ({ rx, tx }) => {
    document.getElementById('rx-speed').textContent = formatSpeed(rx);
    document.getElementById('tx-speed').textContent = formatSpeed(tx);
});

socket.on('security_alert', (alert) => {
    securityAlerts.unshift(alert);
    renderSecurityAlerts();
    const badge = document.getElementById('security-badge');
    const count = securityAlerts.length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
    showToast(`⚠️ ${alert.message}`, 'info');
});

socket.on('notification', ({ type, message }) => showToast(message, type));

socket.on('dns_request', ({ ip, domain, timestamp }) => {
    const feed = document.getElementById('dns-feed');
    if (!feed) return;
    
    // Clear initial message if present
    if (feed.children.length === 1 && feed.children[0].textContent.includes('Esperando')) {
        feed.innerHTML = '';
    }

    const el = document.createElement('div');
    const time = new Date(timestamp).toLocaleTimeString();
    
    // Asignar color al dominio si es conocido
    let color = '#4ade80'; // verde por defecto
    if (domain.includes('facebook') || domain.includes('instagram') || domain.includes('tiktok') || domain.includes('twitter')) color = '#8b5cf6'; // Social
    if (domain.includes('netflix') || domain.includes('youtube') || domain.includes('spotify') || domain.includes('twitch')) color = '#ef4444'; // Streaming
    if (domain.includes('google') || domain.includes('apple') || domain.includes('microsoft')) color = '#3b82f6'; // Tech

    // Nombre del dispositivo si lo conocemos
    const device = devices.get(ip);
    const name = device ? (device.customName || device.hostname || ip) : ip;

    el.innerHTML = `<span style="color:#64748b">[${time}]</span> <span style="color:#f59e0b">${name}</span> -> <span style="color:${color}">${domain}</span>`;
    feed.appendChild(el);
    
    // Auto-scroll to bottom
    feed.scrollTop = feed.scrollHeight;
    
    // Keep max 100 items
    if (feed.children.length > 100) feed.removeChild(feed.firstChild);
});

socket.on('adblock_event', ({ domain, ip }) => {
    const countEl = document.getElementById('adblock-blocked-count');
    if (countEl) {
        countEl.textContent = parseInt(countEl.textContent) + 1;
    }
});

socket.on('tunnel_update', (status) => {
    updateTunnelUI(status);
});

// ════════════════════════════════════════════════
// Render functions
// ════════════════════════════════════════════════

function renderAll() {
    updateStats();
    renderDevices();
    renderSecurityGrid();
    renderProfilesGrid();
}

function updateStats() {
    let online = 0, offline = 0, unknown = 0;
    devices.forEach(d => {
        if (d.isOnline) online++; else offline++;
        if (!d.isTrusted) unknown++;
    });
    document.getElementById('count-online').textContent  = online;
    document.getElementById('count-offline').textContent = offline;
    document.getElementById('count-total').textContent   = devices.size;
    document.getElementById('count-unknown').textContent = unknown;
}

function renderDevices() {
    const arr = getSortedFiltered();
    devicesGrid.innerHTML = '';
    arr.forEach(d => devicesGrid.appendChild(buildCard(d)));
}

function renderSecurityGrid() {
    const untrusted = Array.from(devices.values()).filter(d => !d.isTrusted && d.isOnline);
    securityGrid.innerHTML = '';
    untrusted.forEach(d => {
        const card = buildCard(d);
        card.classList.add('untrusted');
        securityGrid.appendChild(card);
    });
}

function renderSecurityAlerts() {
    alertsList.innerHTML = '';
    securityAlerts.slice(0, 20).forEach(a => {
        const el = document.createElement('div');
        el.className = `alert-item ${a.type}`;
        el.innerHTML = `
            <span class="alert-icon">${a.type === 'new_device' ? '🚨' : '⚡'}</span>
            <span class="alert-msg">${a.message}</span>`;
        alertsList.appendChild(el);
    });
}

function renderLogs() {
    logTable.innerHTML = '';
    logs.forEach(log => {
        const row = document.createElement('div');
        row.className = 'log-row';
        const evClass = `ev-${log.event_type}`;
        const evLabel = log.event_type === 'connected' ? '🟢 Conectado'
                      : log.event_type === 'disconnected' ? '🔴 Desconectado'
                      : '🔵 Descubierto';
        row.innerHTML = `
            <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
            <span class="log-event ${evClass}">${evLabel}</span>
            <span>${log.custom_name || log.ip}</span>`;
        logTable.appendChild(row);
    });
}

function renderProfilesGrid() {
    if (!profilesGrid) return;
    profilesGrid.innerHTML = '';
    
    profiles.forEach(p => {
        const userDevices = Array.from(devices.values()).filter(d => d.profile_id == p.id);
        const isOnline = userDevices.some(d => d.isOnline);
        
        const card = document.createElement('div');
        card.className = `device-card ${isOnline ? '' : 'offline'}`;
        card.innerHTML = `
            <div class="card-top">
                <div style="font-size: 2rem;">${p.icon}</div>
                <div class="card-status ${isOnline ? 'status-on' : 'status-off'}"></div>
            </div>
            <div class="device-name" style="margin-top: 0.5rem; font-size: 1.2rem;">${p.name}</div>
            <div class="device-meta">${isOnline ? '🟢 En casa' : '🔴 Fuera'}</div>
            <div class="device-meta" style="margin-top: 0.5rem;">${userDevices.length} dispositivos asociados</div>
        `;
        profilesGrid.appendChild(card);
    });
}

// ════════════════════════════════════════════════
// Card builder
// ════════════════════════════════════════════════

const CATEGORIES = ['unknown','router','server','pc','mobile','tv','iot'];
const CAT_ICONS  = { unknown:'❓', router:'🔀', server:'🖥️', pc:'💻', mobile:'📱', tv:'📺', iot:'🌐' };

function buildCard(device) {
    const card = document.createElement('div');
    card.className = `device-card${device.isOnline ? '' : ' offline'}`;

    const statusEl = device.isOnline ? `<div class="card-status status-on"></div>`
                                     : `<div class="card-status status-off"></div>`;
    const trustMark = !device.isTrusted ? `<div class="alert-dot" title="No catalogado"></div>` : statusEl;

    const displayName = device.customName || (device.hostname ? device.hostname.split('.')[0] : `Dispositivo ${device.ip.split('.').pop()}`);

    // Latency bar
    const lat = device.time || 0;
    const latPct = Math.min((lat / 100) * 100, 100);
    const latColor = lat < 20 ? '#10b981' : lat < 60 ? '#f59e0b' : '#ef4444';
    const latHtml = device.isOnline ? `
        <div class="latency-bar-wrap">
            <span class="latency-txt">${lat.toFixed(1)} ms</span>
            <div class="latency-track"><div class="latency-fill" style="width:${latPct}%;background:${latColor}"></div></div>
        </div>` : '';

    // Vendor and OS
    const vendorHtml = device.vendor ? `<span class="vendor-badge">🏭 ${device.vendor}</span>` : '';
    const OS_ICONS = { 'Windows': '🪟', 'macOS': '🍏', 'iOS': '📱', 'Android': '🤖', 'Linux': '🐧', 'Android TV': '📺', 'iOS/macOS': '🍏' };
    const osHtml = device.os ? `<span class="vendor-badge" style="background:rgba(255,255,255,0.05);">${OS_ICONS[device.os] || '⚙️'} ${device.os}</span>` : '';
    
    let lastSeenHtml = '';
    if (!device.isOnline && device.lastSeen) {
        const d = new Date(device.lastSeen);
        lastSeenHtml = `<div class="device-meta" style="color:#ef4444; font-size:0.75rem;">Última vez: ${d.toLocaleString()}</div>`;
    }

    const hostnameHtml = device.hostname && device.hostname !== device.ip
        ? `<div class="device-hostname">${device.hostname}</div>` : '';

    // Selectors
    const catOpts = CATEGORIES.map(c =>
        `<option value="${c}" ${device.category === c ? 'selected' : ''}>${CAT_ICONS[c]} ${c}</option>`
    ).join('');
    
    const profOpts = `<option value="">-- Sin perfil --</option>` + profiles.map(p => 
        `<option value="${p.id}" ${device.profile_id == p.id ? 'selected' : ''}>${p.icon} ${p.name}</option>`
    ).join('');

    // Action buttons
    const wolBtn   = device.mac ? `<button class="btn-sm wol" onclick="sendWOL('${device.mac}')" title="Wake On LAN">⚡</button>` : '';
    const trustBtn = !device.isTrusted ? `<button class="btn-sm trust" onclick="trustDevice('${device.ip}')">✔ Confiar</button>` : '';
    const chartBtn = `<button class="btn-sm chart" onclick="openLatencyChart('${device.ip}','${displayName}')" title="Latencia">📊</button>`;
    const insBtn   = `<button class="btn-sm" style="background:rgba(59,130,246,0.15); border-color:rgba(59,130,246,0.3); color:#93c5fd;" onclick="openInspector('${device.ip}')" title="Inspector Detallado">🔍</button>`;
    const auditBtn = `<button class="btn-sm" style="background:rgba(239,68,68,0.15); border-color:rgba(239,68,68,0.3); color:#fca5a5;" onclick="openAuditModal('${device.ip}', '${displayName}')" title="Auditar Seguridad">🛡️</button>`;
    
    // Active Defense Button
    let blockBtn = '';
    if (device.mac) {
        if (device.isBlocked) {
            blockBtn = `<button class="btn-sm" style="background:rgba(239,68,68,0.8); border-color:#ef4444; color:#fff;" onclick="toggleBlock('${device.ip}', '${device.mac}', false)" title="Desbloquear en Router">🛑 Bloqueado</button>`;
        } else {
            blockBtn = `<button class="btn-sm" style="background:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.3); color:#fcd34d;" onclick="toggleBlock('${device.ip}', '${device.mac}', true)" title="Bloquear en Router">🚫 Bloquear</button>`;
        }
    }

    card.innerHTML = `
        <div class="card-top">
            <input class="name-input" type="text" value="${displayName}" data-ip="${device.ip}" onblur="renameDevice(this)" onkeypress="if(event.key==='Enter')this.blur()">
            ${!device.isTrusted ? trustMark : statusEl}
        </div>
        <div class="device-meta">${device.ip}</div>
        ${hostnameHtml}
        ${device.mac ? `<div class="device-meta">${device.mac}</div>` : ''}
        ${lastSeenHtml}
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.3rem;">
            ${vendorHtml}
            ${osHtml}
        </div>
        ${latHtml}
        <div style="display:flex; flex-direction:column; gap:0.3rem; margin-top:0.4rem">
            <select class="cat-select" onchange="setCategory('${device.ip}',this.value)">${catOpts}</select>
            <select class="cat-select" onchange="setProfile('${device.ip}',this.value)">${profOpts}</select>
        </div>
        <div class="card-actions">${wolBtn}${trustBtn}${chartBtn}${insBtn}${auditBtn}${blockBtn}</div>
    `;

    return card;
}

// ════════════════════════════════════════════════
// Filters & sort
// ════════════════════════════════════════════════

function getSortedFiltered() {
    let arr = Array.from(devices.values());
    if (currentFilter === 'online')  arr = arr.filter(d => d.isOnline);
    else if (currentFilter === 'offline') arr = arr.filter(d => !d.isOnline);
    else if (currentFilter !== 'all') arr = arr.filter(d => d.category === currentFilter);

    return arr.sort((a,b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return parseInt(a.ip.split('.').pop()) - parseInt(b.ip.split('.').pop());
    });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderDevices();
    });
});

// ════════════════════════════════════════════════
// Tab navigation
// ════════════════════════════════════════════════

const TAB_TITLES = { 
    dashboard:'Dashboard', 
    security:'Seguridad', 
    logs:'Registro de Actividad', 
    analytics: 'Panel Analítico', 
    dns: 'Monitor DNS', 
    proxy: 'Enrutador Proxy',
    profiles: 'Perfiles', 
    settings:'Configuración' 
};
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        document.getElementById('page-title').textContent = TAB_TITLES[tab];
        
        if (tab === 'settings') loadSettings();
        if (tab === 'profiles') loadProfiles();
        if (tab === 'analytics') loadAnalytics();
        if (tab === 'dns') loadDnsStats();
    });
});

// ════════════════════════════════════════════════
// Actions
// ════════════════════════════════════════════════

window.renameDevice = (el) => {
    const ip = el.dataset.ip;
    const name = el.value.trim();
    if (name) socket.emit('rename_device', { ip, name });
};

window.sendWOL = (mac) => {
    socket.emit('wake_device', mac);
    showToast('⚡ Enviando Magic Packet...', 'info');
};

window.setCategory = (ip, category) => {
    socket.emit('set_category', { ip, category });
};

window.setProfile = async (ip, profileId) => {
    if(!profileId) profileId = null;
    await fetch('/api/profiles/assign', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ip, profileId }) });
    showToast('Perfil asignado', 'success');
};

window.trustDevice = (ip) => {
    socket.emit('trust_device', ip);
    showToast('✔ Dispositivo marcado como confiable', 'success');
};

window.toggleBlock = async (ip, mac, block) => {
    const endpoint = block ? '/api/security/block' : '/api/security/unblock';
    showToast(block ? '⏳ Bloqueando en el router...' : '⏳ Desbloqueando...', 'info');
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, mac })
        });
        const data = await res.json();
        if (data.ok) {
            showToast(block ? '🛑 Dispositivo bloqueado a nivel de hardware' : '✅ Dispositivo desbloqueado', 'success');
        } else {
            showToast(`❌ Error: ${data.error}`, 'error');
        }
    } catch (err) {
        showToast('❌ Error de conexión', 'error');
    }
};

window.saveRouterAuth = async () => {
    const user = document.getElementById('router-user').value.trim();
    const pass = document.getElementById('router-pass').value;
    if (!user || !pass) return showToast('❌ Rellena usuario y contraseña', 'error');
    
    showToast('⏳ Sincronizando con el router...', 'info');
    try {
        const res = await fetch('/api/settings/router', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });
        const data = await res.json();
        if (data.ok) {
            showToast('✅ Credenciales guardadas y verificadas', 'success');
        } else {
            showToast(`❌ Error: ${data.error}`, 'error');
        }
    } catch (err) {
        showToast('❌ Error de conexión', 'error');
    }
};

// ── Modals ──
let latChartInstance = null;
window.openLatencyChart = async (ip, name) => {
    document.getElementById('modal-title').textContent = `Latencia: ${name}`;
    document.getElementById('modal-subtitle').textContent = ip;
    document.getElementById('latency-modal').classList.add('open');

    const res = await fetch(`/api/latency/${ip}`);
    const data = await res.json();

    const labels = data.map(r => new Date(r.timestamp).toLocaleTimeString());
    const values = data.map(r => r.latency);

    const ctx = document.getElementById('latency-chart').getContext('2d');
    if (latChartInstance) latChartInstance.destroy();

    latChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Latencia (ms)',
                data: values,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.1)',
                borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#3b82f6', tension: 0.4, fill: true
            }]
        },
        options: { responsive: true, animation: { duration: 400 }, plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#64748b', maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0 }
            }
        }
    });
};

window.openAuditModal = async (ip, name) => {
    document.getElementById('audit-title').textContent = `Auditoría: ${name}`;
    document.getElementById('audit-subtitle').textContent = ip;
    const content = document.getElementById('audit-content');
    content.innerHTML = `
        <div style="text-align:center; padding: 2rem;">
            <div class="pulse" style="width:24px; height:24px; margin: 0 auto 1rem;"></div>
            Escaneando puertos vulnerables en ${ip}...
        </div>`;
    
    document.getElementById('audit-modal').classList.add('open');

    try {
        const res = await fetch(`/api/audit/${ip}`, { method: 'POST' });
        const data = await res.json();
        
        if (!data.ok) {
            content.innerHTML = `<div style="color:var(--red); text-align:center;">Error: ${data.error}</div>`;
            return;
        }

        const r = data.result;
        let portsHtml = '';
        if (r.openPorts.length === 0) {
            portsHtml = `<div style="text-align:center; padding: 2rem; color: var(--green); font-size: 1.1rem;">✅ Ningún puerto peligroso expuesto.</div>`;
        } else {
            portsHtml = `<table class="audit-table">
                <thead><tr><th>Puerto</th><th>Servicio</th><th>Riesgo</th><th>Descripción</th></tr></thead>
                <tbody>
                    ${r.openPorts.map(p => `
                        <tr>
                            <td><strong>${p.port}</strong></td>
                            <td>${p.service}</td>
                            <td><span style="color: ${p.risk==='Alto'?'#fca5a5':p.risk==='Medio'?'#fcd34d':'#6ee7b7'}">${p.risk}</span></td>
                            <td style="color:var(--muted)">${p.desc}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
        }

        content.innerHTML = `
            <div style="text-align:center; margin-bottom: 1rem;">
                <div class="audit-risk ${r.riskLevel}">Riesgo ${r.riskLevel}</div>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">${r.summary}</p>
            </div>
            ${portsHtml}
        `;
    } catch (err) {
        content.innerHTML = `<div style="color:var(--red); text-align:center;">Fallo de conexión.</div>`;
    }
};

window.closeModal = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('open');
    }
};

// ── V4 Features ──
window.runSpeedTest = async () => {
    const status = document.getElementById('st-status');
    const btn = document.getElementById('btn-speedtest');
    btn.disabled = true;
    btn.textContent = "⏳ Midiendo...";
    status.textContent = "Ping...";

    try {
        const res = await fetch('/api/speedtest', { method: 'POST' });
        const data = await res.json();
        if (data.status === 'success' || data.download) {
            updateSpeedtestUI(data.data || data);
            showToast('✅ Test de velocidad completado', 'success');
        } else {
            status.textContent = "Error";
            showToast('❌ Error: ' + data.message, 'error');
        }
    } catch(err) {
        status.textContent = "Error";
    }
    btn.disabled = false;
    btn.textContent = "🚀 Test Velocidad";
};

function updateSpeedtestUI(data) {
    document.getElementById('st-status').textContent = `Ping: ${Math.round(data.ping)}ms (${data.isp})`;
    document.getElementById('rx-speed').textContent = `${data.download.toFixed(1)} Mbps`;
    document.getElementById('rx-speed').style.color = 'var(--green)';
    document.getElementById('tx-speed').textContent = `${data.upload.toFixed(1)} Mbps`;
    document.getElementById('tx-speed').style.color = '#3b82f6';
}

async function loadProfiles() {
    const res = await fetch('/api/profiles');
    profiles = await res.json();
    renderProfilesGrid();
    renderDevices(); // Update dropdowns
}

window.createProfile = async () => {
    const nameInput = document.getElementById('new-profile-name');
    const name = nameInput.value.trim();
    if (!name) return;

    const icons = ['👨','👩','👦','👧','👴','👵','🦸‍♂️'];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    
    const res = await fetch('/api/profiles', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, icon, color: '#3b82f6' })
    });
    
    if (res.ok) {
        nameInput.value = '';
        showToast(`Perfil ${name} creado`, 'success');
        loadProfiles();
    }
};

async function loadAnalytics() {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    
    // Rellenar KPIs
    if (data.kpis) {
        document.getElementById('kpi-total').textContent = data.kpis.total;
        document.getElementById('kpi-online').textContent = data.kpis.online;
        document.getElementById('kpi-offline').textContent = data.kpis.offline;
        document.getElementById('kpi-untrusted').textContent = data.kpis.untrusted;
    }

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // 1. Gráfico de Conexiones Horarias (Líneas Suavizadas con Gradiente)
    const ctxHourly = document.getElementById('chart-hourly').getContext('2d');
    if (charts.hourly) charts.hourly.destroy();
    
    let gradient = ctxHourly.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59,130,246,0.5)');
    gradient.addColorStop(1, 'rgba(59,130,246,0.0)');

    charts.hourly = new Chart(ctxHourly, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Conexiones',
                data: data.hourly_connections,
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3b82f6',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Hace que la línea sea curva (suavizada)
            }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // 2. Gráfico de Fabricantes (Doughnut)
    const ctxVendors = document.getElementById('chart-vendors').getContext('2d');
    if (charts.vendors) charts.vendors.destroy();
    const vLabels = Object.keys(data.vendors);
    const vData = Object.values(data.vendors);
    charts.vendors = new Chart(ctxVendors, {
        type: 'doughnut',
        data: {
            labels: vLabels.length ? vLabels : ['Desconocido'],
            datasets: [{
                data: vData.length ? vData : [1],
                backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#f1f5f9', padding: 15 } } },
            cutout: '75%'
        }
    });

    // 3. Gráfico de Categorías (Doughnut)
    const ctxCategories = document.getElementById('chart-categories').getContext('2d');
    if (charts.categories) charts.categories.destroy();
    const cLabels = Object.keys(data.categories || {});
    const cData = Object.values(data.categories || {});
    charts.categories = new Chart(ctxCategories, {
        type: 'doughnut',
        data: {
            labels: cLabels.length ? cLabels : ['Desconocido'],
            datasets: [{
                data: cData.length ? cData : [1],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#6366f1'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#f1f5f9', padding: 15 } } },
            cutout: '75%'
        }
    });
}

async function loadDnsStats() {
    const res = await fetch('/api/dns/stats');
    const stats = await res.json();
    const list = document.getElementById('dns-stats-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (stats.length === 0) {
        list.innerHTML = '<div style="color:var(--muted)">No hay datos registrados aún.</div>';
        return;
    }

    const maxCount = Math.max(...stats.map(s => s.count));

    stats.forEach(s => {
        const pct = (s.count / maxCount) * 100;
        const el = document.createElement('div');
        el.style = 'margin-bottom: 0.5rem;';
        el.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:2px;">
                <span style="color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70%;">${s.domain}</span>
                <span style="color:var(--muted)">${s.count} reqs</span>
            </div>
            <div class="latency-track" style="background:var(--surface); height:6px;"><div class="latency-fill" style="width:${pct}%; background:var(--accent);"></div></div>
        `;
        list.appendChild(el);
    });
}

// ── Settings ──
async function loadSettings() {
    const res = await fetch('/api/settings');
    const s = await res.json();
    document.getElementById('cfg-smtp-host').value  = s.smtp_host  || '';
    document.getElementById('cfg-smtp-port').value  = s.smtp_port  || '587';
    document.getElementById('cfg-smtp-user').value  = s.smtp_user  || '';
    document.getElementById('cfg-alert-email').value = s.alert_email || '';
    
    const tgToken = document.getElementById('cfg-tg-token');
    const tgChat = document.getElementById('cfg-tg-chatid');
    if (tgToken) tgToken.value = s.telegram_token || '';
    if (tgChat) tgChat.value = s.telegram_chat_id || '';
}

window.saveSettings = async () => {
    const body = {
        smtp_host:    document.getElementById('cfg-smtp-host').value,
        smtp_port:    document.getElementById('cfg-smtp-port').value,
        smtp_user:    document.getElementById('cfg-smtp-user').value,
        smtp_pass:    document.getElementById('cfg-smtp-pass').value,
        alert_email:  document.getElementById('cfg-alert-email').value
    };
    const res = await fetch('/api/settings', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const data = await res.json();
    showToast(data.ok ? '💾 Configuración guardada' : '❌ Error al guardar', data.ok ? 'success' : 'error');
};

window.testEmail = async () => {
    const body = {
        smtp_host: document.getElementById('cfg-smtp-host').value,
        smtp_port: document.getElementById('cfg-smtp-port').value,
        smtp_user: document.getElementById('cfg-smtp-user').value,
        smtp_pass: document.getElementById('cfg-smtp-pass').value
    };
    showToast('⏳ Probando conexión SMTP...', 'info');
    const res = await fetch('/api/settings/test-email', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const data = await res.json();
    showToast(data.ok ? '✅ Conexión SMTP exitosa' : `❌ Error: ${data.error}`, data.ok ? 'success' : 'error');
};

window.changePassword = async () => {
    const current = document.getElementById('pwd-current').value;
    const newPass  = document.getElementById('pwd-new').value;
    const confirm  = document.getElementById('pwd-confirm').value;
    if (newPass !== confirm) return showToast('❌ Las contraseñas no coinciden', 'error');
    const res = await fetch('/api/settings/change-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ current, newPass }) });
    const data = await res.json();
    showToast(data.ok ? '🔑 Contraseña actualizada' : `❌ ${data.error}`, data.ok ? 'success' : 'error');
    if (data.ok) { document.getElementById('pwd-current').value = ''; document.getElementById('pwd-new').value = ''; document.getElementById('pwd-confirm').value = ''; }
};

window.saveTelegram = async () => {
    const token   = document.getElementById('cfg-tg-token').value.trim();
    const chat_id = document.getElementById('cfg-tg-chatid').value.trim();
    if (!token || !chat_id) return showToast('❌ Rellena el Token y el Chat ID', 'error');
    const res  = await fetch('/api/settings/save-telegram', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token, chat_id }) });
    const data = await res.json();
    showToast(data.ok ? '💾 Configuración de Telegram guardada' : `❌ ${data.error}`, data.ok ? 'success' : 'error');
};

window.testTelegramConn = async () => {
    const token   = document.getElementById('cfg-tg-token').value.trim();
    const chat_id = document.getElementById('cfg-tg-chatid').value.trim();
    if (!token || !chat_id) return showToast('❌ Rellena el Token y el Chat ID primero', 'error');
    showToast('⏳ Enviando mensaje de prueba...', 'info');
    const res  = await fetch('/api/settings/test-telegram', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token, chat_id }) });
    const data = await res.json();
    showToast(data.ok ? '✅ ¡Mensaje enviado! Revisa tu Telegram' : `❌ Error: ${data.error}`, data.ok ? 'success' : 'error');
};

window.logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
};

// ════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════

function formatSpeed(bytesPerSec) {
    if (!bytesPerSec || bytesPerSec < 0) return '0.00 KB/s';
    const mbps = bytesPerSec / 1_000_000;
    if (mbps >= 1) return `${mbps.toFixed(2)} MB/s`;
    return `${(bytesPerSec / 1000).toFixed(1)} KB/s`;
}

function showToast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        el.style.transition = 'all 0.3s';
        setTimeout(() => el.remove(), 300);
    }, 3500);
}
loadProfiles();

// ════════════════════════════════════════════════
// Custom DNS Management
// ════════════════════════════════════════════════

window.loadCustomDns = async () => {
    try {
        const res = await fetch('/api/dns/custom');
        const data = await res.json();
        if (data.ok) {
            const list = document.getElementById('cdns-list');
            if (list) {
                list.innerHTML = data.data.map(d => `
                    <div style="display:flex; justify-content:space-between; padding:0.5rem; background:rgba(0,0,0,0.2); border-radius:4px; font-size:0.85rem; border:1px solid var(--border2);">
                        <div style="display:flex; flex-direction:column;">
                            <strong style="color:var(--text);">${d.domain}</strong>
                            <span style="color:var(--primary); font-family:monospace;">${d.ip}</span>
                        </div>
                        <button onclick="deleteCustomDns('${d.domain}')" style="background:transparent; border:none; color:var(--red); cursor:pointer;" title="Eliminar">❌</button>
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        console.error(e);
    }
};

window.addCustomDns = async () => {
    const domainEl = document.getElementById('cdns-domain');
    const ipEl = document.getElementById('cdns-ip');
    if(!domainEl || !ipEl) return;
    
    const domain = domainEl.value.trim().toLowerCase();
    const ip = ipEl.value.trim();
    if (!domain || !ip) return showToast('Rellena dominio e IP', 'error');

    try {
        const res = await fetch('/api/dns/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain, ip })
        });
        const data = await res.json();
        if (data.ok) {
            domainEl.value = '';
            ipEl.value = '';
            showToast('Dominio DNS añadido', 'success');
            loadCustomDns();
        } else {
            showToast(data.error, 'error');
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
    }
};

window.deleteCustomDns = async (domain) => {
    try {
        const res = await fetch(`/api/dns/custom/${encodeURIComponent(domain)}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.ok) {
            showToast('Dominio eliminado', 'success');
            loadCustomDns();
        } else {
            showToast(data.error, 'error');
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
    }
};

// ════════════════════════════════════════════════
// Router Security & Proxy
// ════════════════════════════════════════════════
window.saveRouterAuth = async () => {
    const user = document.getElementById('router-user').value;
    const pass = document.getElementById('router-pass').value;
    if(!pass) return showToast('La contraseña no puede estar vacía', 'error');
    
    try {
        const res = await fetch('/api/settings/router', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user, pass })
        });
        if(res.ok) {
            showToast('Credenciales guardadas. Bloqueo habilitado.', 'success');
        } else {
            showToast('Error al guardar credenciales', 'error');
        }
    } catch(e) {
        showToast('Error de red', 'error');
    }
};

window.addProxyRoute = async () => {
    const domain = document.getElementById('proxy-domain').value;
    const port = document.getElementById('proxy-port').value;
    if(!domain || !port) return showToast('Rellena ambos campos', 'error');
    
    try {
        const res = await fetch('/api/proxy/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ domain, port })
        });
        if(res.ok) {
            showToast('Enrutamiento creado con éxito en Nginx', 'success');
            document.getElementById('proxy-domain').value = '';
            document.getElementById('proxy-port').value = '';
        } else {
            const err = await res.json();
            showToast(err.error || 'Error al crear enrutamiento', 'error');
        }
    } catch(e) {
        showToast('Error al conectar con el backend', 'error');
    }
};

// ════════════════════════════════════════════════
// Device Inspector (Deep Scan)
// ════════════════════════════════════════════════
const KNOWN_PORTS = {
    21: "FTP (File Transfer)",
    22: "SSH (Secure Shell)",
    23: "Telnet (Inseguro)",
    53: "DNS",
    80: "HTTP (Servidor Web)",
    443: "HTTPS (Web Seguro)",
    445: "SMB (Compartir Archivos)",
    548: "AFP (Apple File Protocol)",
    3306: "MySQL (Base de Datos)",
    3389: "RDP (Escritorio Remoto)",
    5000: "UPnP / Synology NAS",
    5555: "Android ADB (Depuración)",
    8009: "Chromecast / Android TV",
    8080: "HTTP Alternativo",
    9100: "JetDirect (Impresora en Red)",
    62078: "Apple Lockdownd"
};

window.openInspector = (ip) => {
    const device = devices.get(ip);
    if (!device) return;

    const modal = document.getElementById('inspector-modal');
    document.getElementById('ins-name').textContent = device.customName || (device.hostname ? device.hostname.split('.')[0] : `Dispositivo ${device.ip.split('.').pop()}`);
    document.getElementById('ins-ip').textContent = device.ip;
    
    // Identidad
    document.getElementById('ins-icon').textContent = CAT_ICONS[device.category] || '❓';
    document.getElementById('ins-mac').textContent = device.mac || 'Desconocida';
    document.getElementById('ins-vendor').textContent = device.vendor || 'Desconocido';
    document.getElementById('ins-first').textContent = device.firstSeen ? new Date(device.firstSeen).toLocaleString() : 'Desconocido';
    document.getElementById('ins-last').textContent = device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'En línea ahora';

    // Puertos
    const portsContainer = document.getElementById('ins-ports');
    if (!device.ports || device.ports.length === 0) {
        portsContainer.innerHTML = `<span style="color:var(--muted); font-size:0.9rem;">Ningún puerto común detectado (Dispositivo cerrado).</span>`;
    } else {
        portsContainer.innerHTML = device.ports.map(port => {
            const desc = KNOWN_PORTS[port] || 'Servicio Desconocido';
            let color = '#10b981'; // Green
            if (port === 23 || port === 21 || port === 5555) color = '#ef4444'; // Red (dangerous)
            else if (port === 80 || port === 445 || port === 3389 || port === 3306) color = '#f59e0b'; // Yellow (warning)
            
            return `<div style="background:rgba(255,255,255,0.05); border:1px solid ${color}40; border-left:3px solid ${color}; padding:0.4rem 0.8rem; border-radius:4px; font-size:0.85rem;">
                <b style="color:${color};">Puerto ${port}</b>
                <div style="color:var(--text);">${desc}</div>
            </div>`;
        }).join('');
    }

    modal.style.display = 'flex';

    // Latency Chart
    const ctx = document.getElementById('ins-chart').getContext('2d');
    if (window.insChartInstance) window.insChartInstance.destroy();

    fetch(`/api/latency/${ip}`)
        .then(res => res.json())
        .then(data => {
            const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})).reverse();
            const values = data.map(d => d.ping_ms).reverse();
            
            window.insChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Latencia (ms)',
                        data: values,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        });
};

// ════════════════════════════════════════════════
// AdBlock
// ════════════════════════════════════════════════
window.loadAdblockStatus = async () => {
    try {
        const res = await fetch('/api/adblock');
        const data = await res.json();
        
        const toggle = document.getElementById('adblock-toggle');
        const count = document.getElementById('adblock-blocked-count');
        const total = document.getElementById('adblock-total-domains');
        
        if (toggle) toggle.checked = data.enabled;
        if (count) count.textContent = data.blockedCount || 0;
        if (total) total.textContent = data.totalDomains ? data.totalDomains.toLocaleString() : 0;
    } catch (e) {
        console.error(e);
    }
};

window.toggleAdblock = async (enabled) => {
    try {
        const res = await fetch('/api/adblock/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
        });
        if (res.ok) {
            showToast(enabled ? 'AdBlock Activado' : 'AdBlock Desactivado', 'success');
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
    }
};

window.updateAdblockList = async () => {
    showToast('Actualizando lista (puede tardar unos segundos)...', 'info');
    try {
        const res = await fetch('/api/adblock/update', { method: 'POST' });
        const data = await res.json();
        if (data.ok) {
            showToast(`Lista actualizada: ${data.count.toLocaleString()} dominios`, 'success');
            loadAdblockStatus();
        } else {
            showToast('Error actualizando lista', 'error');
        }
    } catch (e) {
        showToast('Error de conexión', 'error');
    }
};

// ════════════════════════════════════════════════
// Acceso Remoto (Tailscale)
// ════════════════════════════════════════════════
window.loadTunnelStatus = async () => {
    try {
        const res = await fetch('/api/tunnel');
        const status = await res.json();
        updateTunnelUI(status);
    } catch (e) {
        console.error(e);
    }
};

function updateTunnelUI(status) {
    const badge = document.getElementById('tunnel-status-badge');
    const urlContainer = document.getElementById('tunnel-url-container');
    const urlInput = document.getElementById('tunnel-url-input');
    const installInstructions = document.getElementById('tunnel-install-instructions');

    if (!badge) return;

    if (status.active) {
        badge.textContent = 'Activo';
        badge.style.background = 'var(--green)';
        badge.style.color = '#000';
        if (urlContainer) urlContainer.style.display = 'flex';
        if (urlInput) urlInput.value = status.ip;
        if (installInstructions) installInstructions.style.display = 'none';
    } else {
        badge.textContent = 'Desconectado';
        badge.style.background = 'var(--muted)';
        badge.style.color = '#fff';
        if (urlContainer) urlContainer.style.display = 'none';
        if (installInstructions) installInstructions.style.display = 'flex';
    }
}


// ════════════════════════════════════════════════════════════
// ROUTER ZTE — Control Avanzado
// ════════════════════════════════════════════════════════════

async function routerSaveAuth() {
    var userEl = document.getElementById('rtr-user');
    const user = userEl && userEl.value ? userEl.value.trim() : '';
    const pass = document.getElementById('rtr-pass') ? document.getElementById('rtr-pass').value : '';
    if (!pass) { showToast('Introduce la contraseña del router', 'error'); return; }
    showToast('Conectando al router...', 'info');
    setRouterStatus('connecting');
    try {
        const res  = await fetch('/api/router/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ router_user: user, router_pass: pass }) });
        const data = await res.json();
        if (data.loggedIn) { setRouterStatus('connected', data.model || 'ZTE ZXHN'); showToast('Conectado al router', 'success'); }
        else               { setRouterStatus('error', data.error || 'Error'); showToast(data.error || 'No se pudo conectar', 'error'); }
    } catch (e) { setRouterStatus('error', e.message); showToast('Error: ' + e.message, 'error'); }
}

async function routerTestConn() {
    showToast('Probando conexion...', 'info');
    setRouterStatus('connecting');
    try {
        const res  = await fetch('/api/router/test');
        const data = await res.json();
        if (data.loggedIn || data.reachable) { setRouterStatus('connected', data.model || 'ZTE ZXHN'); showToast('Router accesible', 'success'); }
        else { setRouterStatus('error', data.error || 'No accesible'); showToast(data.error || 'No accesible', 'error'); }
    } catch (e) { setRouterStatus('error', e.message); }
}

function setRouterStatus(state, label) {
    label = label || '';
    const dot = document.getElementById('router-conn-dot');
    const lbl = document.getElementById('router-conn-label');
    if (!dot || !lbl) return;
    const colors = { connecting: 'var(--orange)', connected: 'var(--green)', error: 'var(--red)', offline: 'var(--muted)' };
    const texts  = { connecting: 'Conectando...', connected: 'Conectado - ' + label, error: 'Error: ' + label, offline: label || 'Sin configurar' };
    const c = colors[state] || colors.offline;
    dot.style.background = c;
    dot.style.boxShadow  = state === 'connected' ? '0 0 8px ' + c : 'none';
    lbl.textContent = texts[state] || 'Sin configurar';
    lbl.style.color = c;
}

async function routerLoadClients() {
    const grid   = document.getElementById('router-clients-grid');
    const status = document.getElementById('router-clients-status');
    if (!grid) return;
    if (status) status.textContent = 'Consultando al router...';
    grid.innerHTML = '<div style="color:var(--muted);padding:1rem;grid-column:1/-1;">Obteniendo lista del router...</div>';
    try {
        const res  = await fetch('/api/router/clients');
        const data = await res.json();
        if (!data.ok || !data.clients || !data.clients.length) {
            grid.innerHTML = '<div style="color:var(--muted);padding:1rem;grid-column:1/-1;">' + (data.error || 'Sin clientes. Configura las credenciales del router.') + '</div>';
            if (status) status.textContent = '';
            return;
        }
        if (status) status.textContent = data.clients.length + ' dispositivo(s)';
        grid.innerHTML = '';
        data.clients.forEach(function(c) {
            const card = document.createElement('div');
            card.className = 'device-card';
            card.innerHTML = '<div class="card-top"><div><div class="device-name">' + (c.name || c.mac) + '</div><div class="device-meta">' + c.mac + '</div><div class="device-hostname" style="color:var(--cyan);">' + c.ip + '</div></div><div class="card-status status-on"></div></div><div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.25rem;">' + (c.band ? '<span class="vendor-badge">📡 ' + c.band + '</span>' : '') + (c.signal !== null ? '<span class="port-badge">📶 ' + c.signal + ' dBm</span>' : '') + '</div><div class="card-actions"><button class="btn-sm" style="background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);color:#f87171;" onclick="routerBlockFromCard(\'' + c.mac + '\')">🚫 Bloquear</button><button class="btn-sm chart" onclick="routerQoSFromCard(\'' + c.mac + '\')">🏎️ QoS</button></div>';
            grid.appendChild(card);
        });
    } catch (e) { grid.innerHTML = '<div style="color:var(--red);">Error: ' + e.message + '</div>'; if (status) status.textContent = ''; }
}

async function routerBlockFromCard(mac) {
    if (!confirm('Bloquear ' + mac + ' en el router?')) return;
    showToast('Bloqueando ' + mac + '...', 'info');
    try {
        const res  = await fetch('/api/router/block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mac: mac }) });
        const data = await res.json();
        showToast(data.ok ? (mac + ' bloqueada') : (data.error || 'Error'), data.ok ? 'success' : 'error');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function routerBlockManual() {
    var macEl = document.getElementById('block-mac-input');
    var mac = (macEl && macEl.value ? macEl.value : '').trim().toUpperCase();
    if (!mac || !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)) { showToast('MAC invalida (AA:BB:CC:DD:EE:FF)', 'error'); return; }
    await routerBlockFromCard(mac);
    var el = document.getElementById('block-mac-input'); if (el) el.value = '';
}

async function routerLoadBlocked() {
    const c = document.getElementById('blocked-macs-list');
    if (!c) return;
    c.innerHTML = '<span style="color:var(--muted);">Cargando...</span>';
    try {
        const res  = await fetch('/api/router/blocked');
        const data = await res.json();
        if (!data.ok || !data.macs || !data.macs.length) { c.innerHTML = '<span style="color:var(--muted);">' + (data.error || 'No hay MACs bloqueadas.') + '</span>'; return; }
        c.innerHTML = '';
        data.macs.forEach(function(mac) {
            const chip = document.createElement('div');
            chip.style.cssText = 'display:inline-flex;align-items:center;gap:0.4rem;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.35);color:#f87171;padding:4px 10px;border-radius:20px;font-size:0.78rem;font-family:monospace;cursor:pointer;';
            chip.title = 'Click para desbloquear'; chip.innerHTML = '🚫 ' + mac + ' <span style="opacity:0.6;">✕</span>';
            chip.addEventListener('click', function() { routerUnblockMac(mac, chip); }); c.appendChild(chip);
        });
    } catch (e) { c.innerHTML = '<span style="color:var(--red);">Error: ' + e.message + '</span>'; }
}

async function routerUnblockMac(mac, chip) {
    if (!confirm('Desbloquear ' + mac + '?')) return;
    try {
        const res  = await fetch('/api/router/unblock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mac: mac }) });
        const data = await res.json();
        if (data.ok) { if (chip) chip.remove(); showToast(mac + ' desbloqueada', 'success'); }
        else showToast(data.error || 'Error', 'error');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function routerWifiToggle(band, enable) {
    showToast((enable ? 'Encendiendo' : 'Apagando') + ' Wi-Fi ' + band + ' GHz...', 'info');
    try {
        const res  = await fetch('/api/router/wifi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enable: enable, band: band }) });
        const data = await res.json();
        showToast(data.ok ? ('Wi-Fi ' + band + 'GHz ' + (enable ? 'encendido' : 'apagado')) : (data.error || 'No soportado'), data.ok ? 'success' : 'error');
        if (!data.ok) { var ids = { '2.4': 'wifi-2g', '5': 'wifi-5g', '6': 'wifi-6g' }; var el = document.getElementById(ids[band]); if (el) el.checked = !enable; }
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function routerLoadWifiStatus() {
    try { const res = await fetch('/api/router/wifi'); const data = await res.json(); if (data.ok) showToast('Wi-Fi: ' + (data.enabled ? 'Activo' : 'Inactivo') + ' - SSID: ' + (data.ssid || 'N/A'), 'info'); } catch (e) {}
}

function routerQoSFromCard(mac) {
    var el = document.getElementById('qos-mac'); if (el) { el.value = mac; el.scrollIntoView({ behavior: 'smooth' }); el.focus(); }
}

async function routerApplyQoS() {
    var qosMacEl = document.getElementById('qos-mac');
    var mac = (qosMacEl && qosMacEl.value ? qosMacEl.value : '').trim().toUpperCase();
    var qosDownEl = document.getElementById('qos-down');
    var down = parseFloat(qosDownEl && qosDownEl.value ? qosDownEl.value : '') || 0;
    var qosUpEl = document.getElementById('qos-up');
    var up   = parseFloat(qosUpEl && qosUpEl.value ? qosUpEl.value : '')   || 0;
    if (!mac || !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)) { showToast('MAC invalida', 'error'); return; }
    showToast('Aplicando QoS a ' + mac + '...', 'info');
    try {
        const res  = await fetch('/api/router/qos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mac: mac, downMbps: down, upMbps: up }) });
        const data = await res.json();
        showToast(data.ok ? ('QoS aplicado a ' + mac) : (data.error || 'No soportado'), data.ok ? 'success' : 'error');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function routerLoadPortForward() {
    var list = document.getElementById('pf-list'); if (!list) return;
    list.innerHTML = '<span style="color:var(--muted);">Cargando...</span>';
    try {
        const res  = await fetch('/api/router/portforward');
        const data = await res.json();
        if (!data.ok || !data.rules || !data.rules.length) { list.innerHTML = '<span style="color:var(--muted);">' + (data.error || 'No hay reglas.') + '</span>'; return; }
        list.innerHTML = '';
        data.rules.forEach(function(rule, idx) {
            var row = document.createElement('div'); row.className = 'log-row'; row.style.gridTemplateColumns = '1fr auto auto auto';
            row.innerHTML = '<div><b>' + (rule.name || '-') + '</b> <span style="color:var(--muted);font-size:0.75rem;">' + rule.protocol + '</span></div><div style="font-family:monospace;font-size:0.8rem;">:' + rule.externalPort + '</div><div style="font-family:monospace;font-size:0.8rem;color:var(--cyan);">' + rule.internalIp + ':' + rule.internalPort + '</div><button class="btn-sm" style="flex:initial;background:rgba(239,68,68,0.1);color:#f87171;" onclick="routerDeletePortForward(' + idx + ', this)">✕</button>';
            list.appendChild(row);
        });
    } catch (e) { list.innerHTML = '<span style="color:var(--red);">Error: ' + e.message + '</span>'; }
}

async function routerAddPortForward() {
    var pfNameEl = document.getElementById('pf-name');
    var name = (pfNameEl && pfNameEl.value ? pfNameEl.value : '').trim();
    var pfExtEl = document.getElementById('pf-ext');
    var ext  = pfExtEl ? pfExtEl.value : '';
    var pfIntEl = document.getElementById('pf-int');
    var int_ = pfIntEl ? pfIntEl.value : '';
    var pfIpEl = document.getElementById('pf-ip');
    var ip   = (pfIpEl && pfIpEl.value ? pfIpEl.value : '').trim();
    var pfProtoEl = document.getElementById('pf-proto');
    var proto= pfProtoEl && pfProtoEl.value ? pfProtoEl.value : 'TCP';
    if (!ext || !ip) { showToast('Puerto externo e IP son obligatorios', 'error'); return; }
    try {
        const res  = await fetch('/api/router/portforward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name || ('Rule_' + ext), protocol: proto, externalPort: ext, internalPort: int_ || ext, internalIp: ip }) });
        const data = await res.json();
        showToast(data.ok ? 'Regla añadida' : (data.error || 'Error'), data.ok ? 'success' : 'error');
        if (data.ok) routerLoadPortForward();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function routerDeletePortForward(idx, btn) {
    if (!confirm('Eliminar esta regla?')) return;
    try {
        const res  = await fetch('/api/router/portforward/' + idx, { method: 'DELETE' });
        const data = await res.json();
        showToast(data.ok ? 'Regla eliminada' : (data.error || 'Error'), data.ok ? 'success' : 'error');
        if (data.ok && btn) btn.closest('.log-row').remove();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function routerReboot() {
    if (!confirm('Reiniciar el router? La red dejara de funcionar ~30-60 segundos.')) return;
    showToast('Enviando comando de reinicio...', 'info');
    try {
        const res  = await fetch('/api/router/reboot', { method: 'POST' });
        const data = await res.json();
        showToast(data.ok ? 'Router reiniciando. Espera 30-60 segundos.' : (data.error || 'Error'), data.ok ? 'success' : 'error');
        if (data.ok) setRouterStatus('offline', 'Reiniciando...');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

socket.on('router_event', function(evt) {
    var icons = { block: '🚫', unblock: '✅', wifi: '📶', reboot: '⚡' };
    var msgs  = { block: 'MAC bloqueada: ' + evt.mac, unblock: 'MAC desbloqueada: ' + evt.mac, wifi: 'Wi-Fi ' + evt.band + 'GHz ' + (evt.enable ? 'encendido' : 'apagado'), reboot: 'Router reiniciando...' };
    showToast((icons[evt.type] || '🔀') + ' ' + (msgs[evt.type] || evt.type), evt.type === 'block' ? 'error' : 'info');
});
