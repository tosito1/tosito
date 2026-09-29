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

# The main app.js has all the functionality (63KB!) - get key sections
print('=== OLD app.js - first 300 lines ===')
print(run(c, 'head -300 /home/tosito/nexus/frontend/app.js'))

c.close()