import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

with sftp.file("/home/tosito/nexus/frontend/index.html", "r") as f:
    html = f.read().decode("utf-8", errors="replace")

new_nav_buttons = """
                <button class="filter-btn active" onclick="switchSubTab('nmap',this)">🔍 Nmap</button>
                <button class="filter-btn" onclick="switchSubTab('arp',this)">📡 ARP Scan</button>
                <button class="filter-btn" onclick="switchSubTab('wol',this)">⚡ Wake-on-LAN</button>
                <button class="filter-btn" onclick="switchSubTab('iperf3',this)">🚀 Test Ancho de Banda</button>
                <button class="filter-btn" onclick="switchSubTab('osint',this)">🕵️ OSINT/Whois</button>
                <button class="filter-btn" onclick="switchSubTab('msf',this)">🛡️ Metasploit</button>
                <button class="filter-btn" onclick="switchSubTab('history',this)">📊 Historial</button>
"""

# Replace the filter-bar content
old_filter_bar = """<button class="filter-btn active" onclick="switchSubTab('nmap',this)">🔍 Nmap</button>
                <button class="filter-btn" onclick="switchSubTab('arp',this)">📡 ARP Scan</button>
                <button class="filter-btn" onclick="switchSubTab('msf',this)">🛡️ Metasploit</button>
                <button class="filter-btn" onclick="switchSubTab('history',this)">📊 Historial</button>"""
html = html.replace(old_filter_bar, new_nav_buttons.strip())

new_panels = """
            <!-- wol sub-panel -->
            <div id="sub-wol" class="sub-panel" style="display:none;">
                <div class="section-header">
                    <h3>⚡ Wake-on-LAN (WoL)</h3>
                    <p>Despierta dispositivos apagados (NAS, PCs) en tu red enviando un paquete mágico.</p>
                </div>
                <div class="card" style="margin-bottom:1.5rem; border-left:4px solid #f59e0b;">
                    <div style="display:flex; gap:1rem; align-items:end;">
                        <div class="form-group" style="margin:0; flex:1;">
                            <label>Dirección MAC del objetivo</label>
                            <input id="wol-mac" class="form-control" placeholder="AA:BB:CC:DD:EE:FF">
                        </div>
                        <button class="btn btn-primary" style="background:#f59e0b; color:black; font-weight:bold;" onclick="runWol()" id="wol-btn">⚡ Encender Dispositivo</button>
                    </div>
                </div>
                <div id="wol-status" style="font-size:0.85rem;color:var(--primary);margin-bottom:1rem;font-weight:500;"></div>
            </div>

            <!-- iperf3 sub-panel -->
            <div id="sub-iperf3" class="sub-panel" style="display:none;">
                <div class="section-header">
                    <h3>🚀 Test de Ancho de Banda Local (iperf3)</h3>
                    <p>Mide la velocidad real entre Nexus y otro dispositivo (que también tenga iperf3 activo).</p>
                </div>
                <div class="card" style="margin-bottom:1.5rem; border-left:4px solid #3b82f6;">
                    <div style="display:flex; gap:1rem; align-items:end;">
                        <div class="form-group" style="margin:0; flex:1;">
                            <label>IP Servidor destino (iperf3 -s)</label>
                            <input id="iperf3-target" class="form-control" placeholder="192.168.1.5">
                        </div>
                        <button class="btn btn-primary" style="background:#3b82f6;" onclick="runIperf3()" id="iperf3-btn">🚀 Iniciar Test</button>
                    </div>
                </div>
                <div id="iperf3-status" style="font-size:0.85rem;color:var(--primary);margin-bottom:1rem;font-weight:500;"></div>
                <div id="iperf3-result" style="display:none;" class="card">
                    <div style="text-align:center; padding: 2rem;">
                        <div style="font-size: 3rem; font-weight:bold; color:var(--green); text-shadow: 0 0 10px rgba(74,222,128,0.5);" id="iperf3-speed">--</div>
                        <div style="color:var(--muted);">Mbits/sec</div>
                    </div>
                    <div id="iperf3-raw" style="font-family:monospace;font-size:0.8rem;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:10px;padding:1rem;max-height:200px;overflow-y:auto;white-space:pre-wrap;color:var(--muted);margin-top:1rem;"></div>
                </div>
            </div>

            <!-- osint sub-panel -->
            <div id="sub-osint" class="sub-panel" style="display:none;">
                <div class="section-header">
                    <h3>🕵️ OSINT / Búsqueda Whois</h3>
                    <p>Consulta información de registro de dominios e IPs externas.</p>
                </div>
                <div class="card" style="margin-bottom:1.5rem; border-left:4px solid #8b5cf6;">
                    <div style="display:flex; gap:1rem; align-items:end;">
                        <div class="form-group" style="margin:0; flex:1;">
                            <label>Dominio o IP Externa</label>
                            <input id="osint-target" class="form-control" placeholder="google.com">
                        </div>
                        <button class="btn btn-primary" style="background:#8b5cf6;" onclick="runOsint()" id="osint-btn">🔍 Consultar Info</button>
                    </div>
                </div>
                <div id="osint-status" style="font-size:0.85rem;color:var(--primary);margin-bottom:1rem;font-weight:500;"></div>
                <div id="osint-raw" style="font-family:monospace;font-size:0.8rem;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:10px;padding:1rem;max-height:400px;overflow-y:auto;white-space:pre-wrap;color:var(--green);display:none;"></div>
            </div>
"""

# Find where to inject the new panels (before sub-msf)
target_panel = "<!-- msf sub-panel -->"
if target_panel in html:
    html = html.replace(target_panel, new_panels + "\n            " + target_panel)
    with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
        f.write(html)
    print("Injected new panels into index.html")
else:
    print("Could not find target_panel in index.html")

sftp.close()
c.close()