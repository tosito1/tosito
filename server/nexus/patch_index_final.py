import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

print("[1] Reading index.html...")
with sftp.file("/home/tosito/nexus/frontend/index.html", "r") as f:
    html = f.read().decode("utf-8", errors="replace")

tools_tab_html = """
        <!-- ═══ TAB: Herramientas ═══ -->
        <div id="tab-tools" class="tab-content" style="display:none; padding:1.5rem;">
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
                <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">Módulos <code>auxiliary/scanner</code> — solo detección, sin explotación activa.</p>
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
        </div>
"""

if 'id="tab-tools"' not in html:
    html = html.replace('<script src="/socket.io/socket.io.js"></script>', tools_tab_html + '\n    <script src="/socket.io/socket.io.js"></script>')
    with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
        f.write(html)
    print("  Tab content injected successfully")
else:
    print("  Tab content already exists")

sftp.close()
c.close()