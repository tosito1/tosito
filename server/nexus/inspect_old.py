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

print('=== /home/tosito/nexus structure ===')
print(run(c, 'find /home/tosito/nexus -type f | head -60'))
print()
print('=== port 3000 process ===')
print(run(c, 'ss -tlnp | grep 3000'))
print(run(c, 'ps aux | grep 3000 | grep -v grep'))
print()
print('=== any package.json ===')
print(run(c, 'cat /home/tosito/nexus/package.json 2>/dev/null | head -20'))
print()
print('=== main source files ===')
print(run(c, 'ls -la /home/tosito/nexus/ 2>/dev/null'))
print(run(c, 'ls -la /home/tosito/nexus/src/ 2>/dev/null'))
print(run(c, 'ls -la /home/tosito/nexus/public/ 2>/dev/null'))

c.close()