import paramiko

HOST = '192.168.1.134'
USER = 'tosito'
PASS = 'tosito13'

def run(c, cmd):
    _, stdout, stderr = c.exec_command(cmd, timeout=15)
    return stdout.read().decode('utf-8', errors='replace').strip()

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

print('=== frontend files ===')
print(run(c, 'ls -la /home/tosito/nexus/frontend/'))
print()

print('=== controller.js ===')
print(run(c, 'cat /home/tosito/nexus/backend/controller.js'))
print()

print('=== auth.js ===')
print(run(c, 'cat /home/tosito/nexus/backend/auth.js'))
print()

print('=== what is on port 3000 ===')
print(run(c, 'ss -tlnp | grep 3000'))
print(run(c, "lsof -i :3000 2>/dev/null | head -5"))

c.close()