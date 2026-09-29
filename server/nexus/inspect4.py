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

# Get tunnel.js (likely the main server)
print('=== tunnel.js (main server) FULL ===')
print(run(c, 'cat /home/tosito/nexus/backend/tunnel.js'))

c.close()