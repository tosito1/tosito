import paramiko, time

HOST = '192.168.1.134'
USER = 'tosito'
PASS = 'tosito13'

def run(c, cmd, sudo=False, timeout=60):
    if sudo:
        full = "echo '" + PASS + "' | sudo -S " + cmd
    else:
        full = cmd
    _, stdout, stderr = c.exec_command(full, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print('  ' + out[:600])
    if err:
        filtered = [l for l in err.splitlines() if 'password' not in l.lower() and 'contrase' not in l.lower() and 'authenticate' not in l.lower()]
        if filtered: print('  [err] ' + chr(10).join(filtered[:6]))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

BACKEND = '/home/tosito/nexus/backend'

print('[1] npm install (may take a minute)...')
run(c, f'cd {BACKEND} && npm install 2>&1 | tail -8', timeout=120)

print('[2] Check server.js references required modules...')
run(c, f'cd {BACKEND} && node --check server.js 2>&1 || true')

print('[3] Check telegram.js dependency...')
run(c, f'ls {BACKEND}/telegram.js 2>/dev/null && echo EXISTS || echo MISSING')

# Create systemd service
print('[4] Creating systemd service for Nexus Node.js backend...')
svc = '''[Unit]
Description=Nexus Network Monitor (Node.js)
After=network.target

[Service]
Type=simple
User=tosito
WorkingDirectory=/home/tosito/nexus/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target'''

sftp = c.open_sftp()
with sftp.file('/tmp/nexus-node.service', 'w') as f:
    f.write(svc)
sftp.close()
run(c, 'mv /tmp/nexus-node.service /etc/systemd/system/nexus-node.service', sudo=True)
run(c, 'systemctl daemon-reload', sudo=True)
run(c, 'systemctl enable nexus-node --now', sudo=True)
time.sleep(6)

print('[5] Service status...')
status = run(c, 'systemctl is-active nexus-node')
print('  Status:', status)
if 'active' not in status:
    print('  Logs:')
    run(c, 'journalctl -u nexus-node -n 30 --no-pager')

print('[6] API check on port 3000...')
time.sleep(2)
run(c, 'curl -s -L http://127.0.0.1:3000/ 2>&1 | head -5')

c.close()
print('DONE')