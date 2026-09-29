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

old_nav = """<ul class="nav-links">
            <li class="nav-item active" data-tab="dashboard">
                <span class="nav-icon">📡</span><span>Dashboard</span>
            </li>
            <li class="nav-item" data-tab="security">
                <span class="nav-icon">🛡️</span><span>Seguridad</span>
                <span class="badge" id="security-badge" style="display:none">0</span>
            </li>
            <li class="nav-item" data-tab="router">
                <span class="nav-icon">🔀</span><span>Router ZTE</span>
                <span class="badge" id="router-badge" style="display:none">!</span>
            </li>
            <li class="nav-item" data-tab="logs">
                <span class="nav-icon">📋</span><span>Actividad</span>
            </li>
            <li class="nav-item" data-tab="analytics">
                <span class="nav-icon">📊</span><span>Analytics</span>
            </li>
            <li class="nav-item" data-tab="dns">
                <span class="nav-icon">👁️</span><span>Tráfico Web</span>
            </li>
            <li class="nav-item" data-tab="tools">
                <span class="nav-icon">🛠️</span><span>Herramientas</span>
            </li>
            <li class="nav-item" data-tab="profiles">
                <span class="nav-icon">👥</span><span>Perfiles</span>
            </li>
            <li class="nav-item" data-tab="proxy">
                <span class="nav-icon">🌍</span><span>Enrutador Proxy</span>
            </li>
            <li class="nav-item" data-tab="settings">
                <span class="nav-icon">⚙️</span><span>Config</span>
            </li>
        </ul>"""

new_nav = """<ul class="nav-links">
            <div class="sidebar-category">📌 General</div>
            <li class="nav-item active" data-tab="dashboard">
                <span class="nav-icon">📡</span><span>Panel Principal</span>
            </li>
            <li class="nav-item" data-tab="profiles">
                <span class="nav-icon">👥</span><span>Presencia</span>
            </li>

            <div class="sidebar-category">🌐 Gestión de Red</div>
            <li class="nav-item" data-tab="router">
                <span class="nav-icon">🔀</span><span>Control Router</span>
                <span class="badge" id="router-badge" style="display:none">!</span>
            </li>
            <li class="nav-item" data-tab="dns">
                <span class="nav-icon">👁️</span><span>Tráfico y AdBlock</span>
            </li>
            <li class="nav-item" data-tab="analytics">
                <span class="nav-icon">📊</span><span>Analytics & Logs</span>
            </li>

            <div class="sidebar-category">🛡️ Seguridad</div>
            <li class="nav-item" data-tab="security">
                <span class="nav-icon">🛡️</span><span>Centro Seguridad</span>
                <span class="badge" id="security-badge" style="display:none">0</span>
            </li>
            <li class="nav-item" data-tab="tools">
                <span class="nav-icon">🛠️</span><span>Herramientas</span>
            </li>

            <div class="sidebar-category">⚙️ Sistema</div>
            <li class="nav-item" data-tab="proxy">
                <span class="nav-icon">🌍</span><span>Proxy Inverso</span>
            </li>
            <li class="nav-item" data-tab="settings">
                <span class="nav-icon">⚙️</span><span>Configuración</span>
            </li>
        </ul>"""

if old_nav in html:
    html = html.replace(old_nav, new_nav)
    with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
        f.write(html)
    print("Replaced nav-links with categorized structure.")
else:
    print("Could not find exactly old_nav in index.html.")

sftp.close()
c.close()