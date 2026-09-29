import paramiko, re

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

with sftp.file("/home/tosito/nexus/frontend/app.js", "r") as f:
    js = f.read().decode("utf-8", errors="replace")

old_titles = """const TAB_TITLES = { 
    dashboard:'Dashboard', 
    security:'Seguridad', 
    logs:'Registro de Actividad', 
    analytics: 'Panel Analítico', 
    dns: 'Monitor DNS', 
    proxy: 'Enrutador Proxy',
    profiles: 'Perfiles', 
    settings:'Configuración' 
};"""

new_titles = """const TAB_TITLES = {
    dashboard: 'Panel Principal',
    security: 'Centro de Seguridad',
    router: 'Control del Router',
    analytics: 'Analytics y Registros',
    dns: 'Tráfico Web y AdBlock', 
    proxy: 'Proxy Inverso (Nginx)',
    profiles: 'Control de Presencia', 
    tools: 'Herramientas de Red',
    settings: 'Configuración del Sistema' 
};"""

if old_titles in js:
    js = js.replace(old_titles, new_titles)
    with sftp.file("/home/tosito/nexus/frontend/app.js", "w") as f:
        f.write(js)
    print("Updated TAB_TITLES in app.js")
else:
    print("Could not find old TAB_TITLES")

sftp.close()
c.close()