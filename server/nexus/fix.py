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
    if out: print('  ' + out[:500])
    if err:
        filtered = [l for l in err.splitlines() if 'password' not in l.lower() and 'contrase' not in l.lower() and 'authenticate' not in l.lower()]
        if filtered: print('  ERR: ' + '\n  '.join(filtered[:10]))
    return out

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS)

print('[1] Creating venv and installing packages...')
run(client, 'python3 -m venv /opt/nexus/venv', sudo=True)
run(client, 'chown -R tosito:tosito /opt/nexus/venv', sudo=True)
run(client, '/opt/nexus/venv/bin/pip install fastapi "uvicorn[standard]" python-nmap psutil netifaces -q')

print('[2] Updating service file to use venv...')
svc_content = '[Unit]\nDescription=Nexus Network API\nAfter=network.target\n\n[Service]\nType=simple\nUser=root\nWorkingDirectory=/opt/nexus/api\nExecStart=/opt/nexus/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 3003\nRestart=always\nRestartSec=5\n\n[Install]\nWantedBy=multi-user.target'
sftp = client.open_sftp()
with sftp.file('/tmp/nexus-api.service', 'w') as f:
    f.write(svc_content)
sftp.close()
run(client, 'mv /tmp/nexus-api.service /etc/systemd/system/nexus-api.service', sudo=True)
run(client, 'systemctl daemon-reload', sudo=True)
run(client, 'systemctl restart nexus-api', sudo=True)
time.sleep(6)

print('[3] Service status...')
s = run(client, 'systemctl is-active nexus-api')
print('Status:', s)
if 'active' not in s:
    run(client, 'journalctl -u nexus-api -n 30 --no-pager')

print('[4] API check...')
run(client, 'curl -s http://127.0.0.1:3003/ 2>&1')

print('[5] Nginx sites...')
run(client, 'ls -la /etc/nginx/sites-enabled/', sudo=True)
run(client, 'nginx -t 2>&1', sudo=True)

client.close()
print('DONE')