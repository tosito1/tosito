const API = "";  // Same origin

// ── State ────────────────────────────────────────────────────────────────────
let state = {
  devices: [],
  networkInfo: null,
  scanning: false,
  currentSection: "dashboard",
};

// ── Navigation ────────────────────────────────────────────────────────────────
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    navigateTo(section);
  });
});

function navigateTo(section) {
  state.currentSection = section;
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.section === section));
  document.querySelectorAll(".section").forEach(s => s.classList.toggle("active", s.id === `section-${section}`));
  const titles = {
    dashboard: ["Dashboard", "Visión general de la red"],
    devices: ["Dispositivos", "Todos los dispositivos en la red"],
    network: ["Información de red", "Gateway, DNS, subred y latencia"],
    history: ["Historial", "Escaneos anteriores"],
    alerts: ["Alertas", "Dispositivos nuevos detectados"],
  };
  document.getElementById("pageTitle").textContent = titles[section][0];
  document.getElementById("pageSubtitle").textContent = titles[section][1];
  if (section === "network" && !state.networkInfo) loadNetworkInfo();
  if (section === "history") loadHistory();
  if (section === "alerts") loadAlerts();
}

// ── Scan ──────────────────────────────────────────────────────────────────────
async function triggerScan() {
  if (state.scanning) return;
  state.scanning = true;
  const btn = document.getElementById("scanBtn");
  btn.disabled = true;
  btn.classList.add("scanning");
  btn.querySelector("span").textContent = "Escaneando";
  document.getElementById("scanProgressBar").style.display = "block";

  try {
    const res = await fetch(`${API}/api/scan`);
    const data = await res.json();
    if (!data.success) throw new Error(data.detail || "Error en el escaneo");

    state.devices = data.devices;
    const scannedAt = new Date(data.scanned_at + "Z").toLocaleString("es-ES");
    document.getElementById("lastScan").textContent = `Último escaneo: ${scannedAt}`;
    document.getElementById("statOnline").textContent = data.devices_found;
    document.getElementById("statNew").textContent = data.new_devices;

    renderNetworkMap(data.devices);
    renderDevicesGrid(data.devices);
    loadAlertBadge();
    loadHistory();
  } catch (err) {
    alert("Error al escanear: " + err.message);
  } finally {
    state.scanning = false;
    btn.disabled = false;
    btn.classList.remove("scanning");
    btn.querySelector("span").textContent = "Escanear";
    document.getElementById("scanProgressBar").style.display = "none";
  }
}

// ── Network Map ───────────────────────────────────────────────────────────────
function getDeviceEmoji(device) {
  const vendor = (device.vendor || "").toLowerCase();
  const host = (device.hostname || "").toLowerCase();
  if (vendor.includes("raspberry") || host.includes("raspberry")) return "🍓";
  if (vendor.includes("apple")) return "🍎";
  if (vendor.includes("samsung")) return "📱";
  if (vendor.includes("google")) return "🔵";
  if (vendor.includes("microsoft")) return "🪟";
  if (host.includes("router") || host.includes("gateway") || host.includes("movistar") || host.includes("vodafone")) return "📡";
  if (host.includes("phone") || host.includes("android")) return "📱";
  if (host.includes("tv") || host.includes("chromecast")) return "📺";
  if (host.includes("laptop") || host.includes("macbook")) return "💻";
  return "🖥️";
}

function renderNetworkMap(devices) {
  const map = document.getElementById("networkMap");
  document.getElementById("mapEmpty").style.display = "none";
  map.innerHTML = "";

  // Router node
  const routerNode = createMapNode("📡", "Router", state.networkInfo?.gateway || "192.168.1.1", "router");
  map.appendChild(routerNode);

  devices.forEach(d => {
    const isSelf = state.networkInfo && d.ip === state.networkInfo.local_ip;
    const cls = isSelf ? "self" : "device";
    const node = createMapNode(getDeviceEmoji(d), d.hostname || d.vendor || "Dispositivo", d.ip, cls);
    node.onclick = () => openDeviceModal(d);
    map.appendChild(node);
  });
}

function createMapNode(emoji, label, ip, cls) {
  const node = document.createElement("div");
  node.className = "map-node";
  node.innerHTML = `
    <div class="node-circle ${cls}">${emoji}</div>
    <div class="node-ip">${ip}</div>
    <div class="node-label">${label}</div>
  `;
  return node;
}

// ── Devices Grid ──────────────────────────────────────────────────────────────
function renderDevicesGrid(devices) {
  const grid = document.getElementById("devicesGrid");
  if (!devices.length) {
    grid.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><p>No se encontraron dispositivos.</p></div>`;
    return;
  }
  grid.innerHTML = devices.map(d => `
    <div class="device-card" onclick="openDeviceModal(${JSON.stringify(d).replace(/"/g, '&quot;')})">
      <div class="device-card-header">
        <span class="device-emoji">${getDeviceEmoji(d)}</span>
        <span class="device-status-pill">● Online</span>
      </div>
      <div class="device-ip">${d.ip}</div>
      <div class="device-hostname">${d.hostname || "Sin hostname"}</div>
      <div class="device-meta">
        ${d.mac ? `<span class="device-tag">${d.mac}</span>` : ""}
        ${d.vendor && d.vendor !== "Desconocido" ? `<span class="device-tag">${d.vendor}</span>` : ""}
      </div>
    </div>
  `).join("");
}

function filterDevices() {
  const q = document.getElementById("deviceSearch").value.toLowerCase();
  const filtered = state.devices.filter(d =>
    d.ip.includes(q) || (d.hostname || "").toLowerCase().includes(q) || (d.vendor || "").toLowerCase().includes(q)
  );
  renderDevicesGrid(filtered);
}

// ── Device Modal ──────────────────────────────────────────────────────────────
async function openDeviceModal(device) {
  if (typeof device === "string") device = JSON.parse(device);
  const modal = document.getElementById("deviceModal");
  const content = document.getElementById("modalContent");
  modal.style.display = "flex";

  content.innerHTML = `
    <div class="modal-device-ip">${device.ip}</div>
    <div class="modal-hostname">${device.hostname || "Sin hostname"} · ${device.vendor || "Fabricante desconocido"}</div>
    ${device.mac ? `<div class="device-tag" style="display:inline-block;margin-bottom:12px">${device.mac}</div>` : ""}
    <div class="modal-loading">Escaneando puertos y SO...</div>
  `;

  try {
    const res = await fetch(`${API}/api/scan/deep?ip=${encodeURIComponent(device.ip)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.detail);
    const d = data.data;

    const openPorts = (d.ports || []).filter(p => p.state === "open");
    content.innerHTML = `
      <div class="modal-device-ip">${device.ip}</div>
      <div class="modal-hostname">${d.hostname || device.hostname || "Sin hostname"} · ${device.vendor || "Fabricante desconocido"}</div>
      ${device.mac ? `<div class="device-tag" style="display:inline-block">MAC: ${device.mac}</div>` : ""}
      ${d.os_detected && d.os_detected !== "Desconocido" ? `<div class="modal-section-title">Sistema operativo</div><div class="os-badge">🖥️ ${d.os_detected}</div>` : ""}
      <div class="modal-section-title">Puertos abiertos (${openPorts.length})</div>
      ${openPorts.length ? `
        <table class="ports-table">
          <thead><tr><th>Puerto</th><th>Protocolo</th><th>Servicio</th><th>Versión</th></tr></thead>
          <tbody>
            ${openPorts.map(p => `
              <tr>
                <td class="port-open">${p.port}</td>
                <td>${p.protocol}</td>
                <td>${p.service || "—"}</td>
                <td>${[p.product, p.version].filter(Boolean).join(" ") || "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : "<p style='color:var(--text-500);font-size:0.875rem'>No se detectaron puertos abiertos en el top 100.</p>"}
    `;
  } catch (err) {
    content.innerHTML += `<p style="color:var(--rose-400);font-size:0.875rem;margin-top:12px">Error al escanear: ${err.message}</p>`;
  }
}

function closeDeviceModal() {
  document.getElementById("deviceModal").style.display = "none";
}

// ── Network Info ──────────────────────────────────────────────────────────────
async function loadNetworkInfo() {
  const grid = document.getElementById("networkInfoGrid");
  try {
    const res = await fetch(`${API}/api/network-info`);
    const data = await res.json();
    if (!data.success) throw new Error(data.detail);
    state.networkInfo = data.data;
    const d = data.data;
    const cards = [
      ["IP del servidor", d.local_ip || "—", true],
      ["Gateway (Router)", d.gateway || "—", true],
      ["Subred", d.subnet || "—", false],
      ["Máscara de red", d.netmask || "—", false],
      ["Interfaz", d.interface || "—", false],
      ["DNS primario", (d.dns_servers || [])[0] || "—", false],
      ["DNS secundario", (d.dns_servers || [])[1] || "—", false],
      ["Latencia al router", d.gateway_latency_ms != null ? `${d.gateway_latency_ms} ms` : "—", false],
    ];
    grid.innerHTML = cards.map(([label, value, highlight]) => `
      <div class="info-card">
        <div class="info-card-label">${label}</div>
        <div class="info-card-value ${highlight ? "highlight" : ""}">${value}</div>
      </div>
    `).join("");
    document.getElementById("statLatency").textContent = d.gateway_latency_ms != null ? `${d.gateway_latency_ms}ms` : "—";
  } catch (err) {
    grid.innerHTML = `<div class="info-loading">Error al cargar: ${err.message}</div>`;
  }
}

// ── History ───────────────────────────────────────────────────────────────────
async function loadHistory() {
  const tbody = document.getElementById("historyBody");
  try {
    const res = await fetch(`${API}/api/history?limit=30`);
    const data = await res.json();
    if (!data.success) throw new Error(data.detail);
    document.getElementById("statScans").textContent = data.count;
    if (!data.history.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="empty-td">Sin historial aún</td></tr>`;
      return;
    }
    tbody.innerHTML = data.history.map(h => `
      <tr>
        <td>${new Date(h.timestamp + "Z").toLocaleString("es-ES")}</td>
        <td><span class="type-badge">${h.type}</span></td>
        <td>${h.devices_found}</td>
      </tr>
    `).join("");
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-td">Error: ${err.message}</td></tr>`;
  }
}

// ── Alerts ────────────────────────────────────────────────────────────────────
async function loadAlerts() {
  const list = document.getElementById("alertsList");
  try {
    const res = await fetch(`${API}/api/alerts`);
    const data = await res.json();
    if (!data.success) throw new Error(data.detail);
    if (!data.alerts.length) {
      list.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><p>Sin alertas de nuevos dispositivos.</p></div>`;
      return;
    }
    list.innerHTML = data.alerts.map(a => `
      <div class="alert-item">
        <div>
          <div class="alert-ip">${a.ip}</div>
          <div class="alert-info">${a.hostname || "Sin hostname"} · ${a.vendor || "Fabricante desconocido"} · MAC: ${a.mac || "—"}</div>
        </div>
        <div class="alert-time">${new Date(a.first_seen + "Z").toLocaleString("es-ES")}</div>
      </div>
    `).join("");
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

async function loadAlertBadge() {
  try {
    const res = await fetch(`${API}/api/alerts`);
    const data = await res.json();
    const badge = document.getElementById("alertBadge");
    if (data.count > 0) {
      badge.textContent = data.count;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  } catch { /* silent */ }
}

async function clearAlerts() {
  await fetch(`${API}/api/alerts`, { method: "DELETE" });
  document.getElementById("alertBadge").style.display = "none";
  loadAlerts();
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  await loadNetworkInfo();
  await loadAlertBadge();
  await loadHistory();
}

init();
