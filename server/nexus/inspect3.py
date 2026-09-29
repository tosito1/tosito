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

print('=== network.js (main backend) ===')
print(run(c, 'cat /home/tosito/nexus/backend/tunnel.js 2>/dev/null'))
print()
print('=== dns_server.js ===')
print(run(c, 'cat /home/tosito/nexus/backend/dns_server.js 2>/dev/null'))
print()
print('=== database.js ===')
print(run(c, 'cat /home/tosito/nexus/backend/database.js 2>/dev/null'))
print()
print('=== mailer.js ===')
print(run(c, 'cat /home/tosito/nexus/backend/mailer.js 2>/dev/null'))
print()
print('=== what service runs port 3000 ===')
print(run(c, 'systemctl list-units --type=service --state=running | grep -i nexus'))
print(run(c, 'systemctl list-units --type=service --state=running | grep -i network'))
print(run(c, 'ls /etc/systemd/system/ | grep -v @ | grep -v .wants | head -30'))

c.close()