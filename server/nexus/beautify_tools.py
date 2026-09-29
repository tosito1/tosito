import paramiko, re

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

with sftp.file("/home/tosito/nexus/frontend/index.html", "r") as f:
    html = f.read().decode("utf-8", errors="replace")

# We will replace the ENTIRE tab-tools block
old_marker = "<!-- ═══ TAB: Herramientas ═══ -->"
end_marker = "        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->"

if old_marker in html and end_marker in html:
    start_idx = html.find(old_marker)
    end_idx = html.find(end_marker)
    
    new_tools = """<!-- ═══ TAB: Herramientas ═══ -->
        <div id="tab-tools" class="tab-content">
            
            <!-- Sub-nav using Nexus filter-bar -->
            <div class="filter-bar" style="margin-bottom: 2rem;">
                <button class="filter-btn active" onclick="switchSubTab('nmap',this)">🔍 Nmap</button>
                <button class="filter-btn" onclick="switchSubTab('arp',this)">📡 ARP Scan</button>
                <button class="filter-btn" onclick="switchSubTab('msf',this)">🛡️ Metasploit</button>
                <button class="filter-btn" onclick="switchSubTab('history',this)">📊 Historial</button>
            </div>

            <!-- nmap sub-panel -->
            <div id="sub-nmap" class="sub-panel">
                <div class="section-header">
                    <h3>Escáner de Red Profundo (Nmap)</h3>
                    <p>Detecta puertos abiertos, servicios reales y sistemas operativos de la red.</p>
                </div>
                <div class="card" style="margin-bottom:1.5rem;">
                    <div style="display:grid; grid-template-columns:2fr 1fr auto auto; gap:0.75rem; align-items:end;">
                        <div class="form-group" style="margin:0;">
                            <label>Target (IP o subred)</label>
                            <input id="nmap-target" class="form-control" value="192.168.1.0/24" placeholder="192.168.1.1 o subred">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label>Modo de Escaneo</label>
                            <select id="nmap-mode" class="form-control" style="background:rgba(0,0,0,0.3); border:1px solid var(--border2); color:white;">
                                <option value="quick">⚡ Quick (Top 100)</option>
                                <option value="deep">🔬 Deep (Todos + OS)</option>
                                <option value="vuln">⚠️ Scripts (Vulnerabilidades)</option>
                                <option value="ping">📡 Ping Scan (Sólo hosts)</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="runNmap()" id="nmap-btn">▶ Ejecutar Escáner</button>
                        <button class="btn-secondary" onclick="exportNmapResult()">⬇ Exportar JSON</button>
                    </div>
                </div>
                <div id="nmap-status" style="font-size:0.85rem;color:var(--primary);margin-bottom:1rem;font-weight:500;"></div>
                <div id="nmap-result" style="font-family:monospace;font-size:0.8rem;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:10px;padding:1rem;max-height:420px;overflow-y:auto;white-space:pre-wrap;color:var(--green);display:none;margin-bottom:1.5rem;"></div>
                <div id="nmap-table" style="display:none;" class="card">
                    <h4 style="margin-bottom:1rem; color:var(--text);">Resultados tabulares</h4>
                    <table class="log-table" style="width:100%; text-align:left; border-collapse:collapse;" id="nmap-ports-table">
                        <thead><tr style="color:var(--muted); border-bottom:1px solid var(--border2);">
                            <th style="padding:10px;">Puerto</th>
                            <th style="padding:10px;">Protocolo</th>
                            <th style="padding:10px;">Servicio</th>
                            <th style="padding:10px;">Versión</th>
                            <th style="padding:10px;">Estado</th>
                        </tr></thead>
                        <tbody id="nmap-ports-body"></tbody>
                    </table>
                </div>
            </div>

            <!-- arp-scan sub-panel -->
            <div id="sub-arp" class="sub-panel" style="display:none;">
                <div class="section-header">
                    <h3>ARP Scanner (Capa 2)</h3>
                    <p>Encuentra dispositivos ocultos saltándose firewalls enviando peticiones ARP directas.</p>
                </div>
                <div class="card" style="margin-bottom:1.5rem;">
                    <div style="display:flex; gap:1rem; align-items:end;">
                        <div class="form-group" style="margin:0; flex:1;">
                            <label>Rango de Red</label>
                            <input id="arp-subnet" class="form-control" value="192.168.1.0/24">
                        </div>
                        <button class="btn btn-primary" onclick="runArpScan()" id="arp-btn">📡 Rastrear Red</button>
                    </div>
                </div>
                <div id="arp-status" style="font-size:0.85rem;color:var(--primary);margin-bottom:1rem;font-weight:500;"></div>
                <div id="arp-result" class="devices-grid"></div>
            </div>

            <!-- msf sub-panel -->
            <div id="sub-msf" class="sub-panel" style="display:none;">
                <div class="section-header">
                    <h3>Metasploit Framework</h3>
                    <p>Auditoría avanzada utilizando escáneres auxiliares de MSF.</p>
                </div>
                <div class="card" style="margin-bottom:1.5rem; border-left:4px solid #ef4444;">
                    <div style="display:grid; grid-template-columns:2fr 1fr auto; gap:1rem; align-items:end;">
                        <div class="form-group" style="margin:0;">
                            <label>Módulo Auxiliar</label>
                            <select id="msf-module" class="form-control" style="background:rgba(0,0,0,0.3); border:1px solid var(--border2); color:white;" onchange="updateMsfInfo()">
                                <option value="">Cargando módulos de Metasploit...</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label>RHOSTS (Target IP)</label>
                            <input id="msf-rhosts" class="form-control" value="192.168.1.0/24">
                        </div>
                        <button class="btn btn-primary" style="background:rgba(239,68,68,0.8);" onclick="runMsf()" id="msf-btn">🔥 Lanzar Exploit/Scanner</button>
                    </div>
                </div>
                <div id="msf-info" style="font-size:0.85rem;color:var(--muted);margin-bottom:1rem;padding:12px;background:rgba(0,0,0,0.2);border-radius:8px;border:1px solid var(--border);display:none;"></div>
                <div id="msf-status" style="font-size:0.85rem;color:var(--primary);margin-bottom:1rem;font-weight:500;"></div>
                <div id="msf-result" style="display:none;">
                    <div id="msf-summary" style="padding:12px 16px;border-radius:10px;margin-bottom:1rem;font-weight:bold;background:rgba(0,0,0,0.4);border:1px solid var(--border);"></div>
                    <div id="msf-raw" style="font-family:monospace;font-size:0.8rem;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:10px;padding:1rem;max-height:400px;overflow-y:auto;white-space:pre-wrap;color:var(--muted);"></div>
                </div>
            </div>

            <!-- history sub-panel -->
            <div id="sub-history" class="sub-panel" style="display:none;">
                <div class="section-header">
                    <h3>Base de Datos de Resultados</h3>
                    <p>Registro histórico de escaneos y auditorías ejecutadas.</p>
                </div>
                <div class="card" style="padding:0; overflow:hidden;">
                    <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                        <thead>
                            <tr style="background:rgba(0,0,0,0.4); border-bottom:1px solid var(--border2); text-align:left;">
                                <th style="padding:12px 16px; color:var(--muted);">Herramienta</th>
                                <th style="padding:12px 16px; color:var(--muted);">Target</th>
                                <th style="padding:12px 16px; color:var(--muted);">Modo/Módulo</th>
                                <th style="padding:12px 16px; color:var(--muted);">Resultado Rápido</th>
                                <th style="padding:12px 16px; color:var(--muted);">Fecha</th>
                            </tr>
                        </thead>
                        <tbody id="tools-history-body">
                            <tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--muted);">Sin resultados aún</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
        </div>
"""

    html = html[:start_idx] + new_tools + "\n" + html[end_idx:]
    with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
        f.write(html)
    print("Replaced tools tab UI with proper Nexus CSS components.")
else:
    print("Could not find markers.")

sftp.close()
c.close()