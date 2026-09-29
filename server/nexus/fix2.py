import paramiko, time

HOST = '192.168.1.134'
USER = 'tosito'
PASS = 'tosito13'

def run(c, cmd, sudo=False):
    if sudo:
        full = "echo '" + PASS + "' | sudo -S " + cmd
    else:
        full = cmd
    _, stdout, stderr = c.exec_command(full, timeout=120)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print('  ' + out[:800])
    if err:
        filtered = [l for l in err.splitlines() if 'password' not in l.lower() and 'contrase' not in l.lower() and 'authenticate' not in l.lower()]
        if filtered: print('  [err] ' + '\n  '.join(filtered[:10]))
    return out

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS)

# 1. Install venv package and pip
print('[1] Installing python3-venv and pip...')
run(client, 'apt-get install -y python3-venv python3-pip 2>&1 | tail -4', sudo=True)

# 2. Create venv
print('[2] Creating virtual environment...')
run(client, 'python3 -m venv /opt/nexus/venv', sudo=True)
run(client, 'chown -R tosito:tosito /opt/nexus/venv', sudo=True)

# 3. Install packages in venv
print('[3] Installing packages in venv...')
run(client, '/opt/nexus/venv/bin/pip install fastapi "uvicorn[standard]" python-nmap psutil netifaces -q 2>&1 | tail -5')

# 4. Update systemd service
print('[4] Updating service...')
svc_content = '[Unit]\nDescription=Nexus Network API\nAfter=network.target\n\n[Service]\nType=simple\nUser=root\nWorkingDirectory=/opt/nexus/api\nExecStart=/opt/nexus/venv/bin/uvicorn main:app --host 0.0.0.0 --port 3003\nRestart=always\nRestartSec=5\n\n[Install]\nWantedBy=multi-user.target'
sftp = client.open_sftp()
with sftp.file('/tmp/nexus-api.service', 'w') as f:
    f.write(svc_content)
sftp.close()
run(client, 'mv /tmp/nexus-api.service /etc/systemd/system/nexus-api.service', sudo=True)
run(client, 'systemctl daemon-reload', sudo=True)
run(client, 'systemctl restart nexus-api', sudo=True)
time.sleep(6)

# 5. Check service
print('[5] Service status...')
s = run(client, 'systemctl is-active nexus-api')
print('  Status:', s)
if 'active' not in s:
    run(client, 'journalctl -u nexus-api -n 20 --no-pager')

# 6. Fix nginx conflict - check which old nexus.local exists in sites-available
print('[6] Fixing nginx conflict...')
run(client, 'cat /etc/nginx/sites-available/nexus.local 2>/dev/null || echo NOT_FOUND')
# The new config was written, conflict is with old duplicate. Remove old if different port
# Our new config is already correct in sites-available, just reload
run(client, 'nginx -t 2>&1', sudo=True)
run(client, 'systemctl reload nginx 2>&1', sudo=True)

# 7. Final test
print('[7] API test...')
time.sleep(2)
run(client, 'curl -s http://127.0.0.1:3003/ 2>&1')

client.close()
print('DONE')