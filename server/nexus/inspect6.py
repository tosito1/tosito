import paramiko

HOST = '192.168.1.134'
USER = 'tosito'
PASS = 'tosito13'

def run(c, cmd):
    _, stdout, stderr = c.exec_command(cmd, timeout=30)
    return stdout.read().decode('utf-8', errors='replace').strip()

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

# Find the main server entry point
print('=== All JS files in backend (not node_modules) ===')
print(run(c, 'find /home/tosito/nexus/backend -maxdepth 1 -name "*.js" | xargs ls -la'))

# check if there's an index.js or server.js
print()
print('=== index.html sections/tabs of OLD frontend ===')
print(run(c, 'grep -n "data-tab\\|section\\|<nav\\|panel\\|id=" /home/tosito/nexus/frontend/index.html | head -60'))

print()
print('=== routes in old backend ===')
print(run(c, 'grep -n "app.get\\|app.post\\|router.get\\|router.post\\|socket.on" /home/tosito/nexus/backend/*.js 2>/dev/null | grep -v node_modules | head -60'))

c.close()