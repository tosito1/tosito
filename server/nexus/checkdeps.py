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

print('=== package.json of old backend ===')
print(run(c, 'cat /home/tosito/nexus/backend/package.json 2>/dev/null'))

print()
print('=== node installed? ===')
print(run(c, 'node --version 2>/dev/null || echo NOT_INSTALLED'))
print(run(c, 'npm --version 2>/dev/null || echo NOT_INSTALLED'))

print()
print('=== node_modules exists? ===')
print(run(c, 'ls /home/tosito/nexus/backend/node_modules/ | wc -l'))

print()
print('=== all backend JS files ===')
print(run(c, 'find /home/tosito/nexus/backend -maxdepth 1 -name "*.js" -exec ls -la {} \;'))

c.close()