import paramiko

HOST = '192.168.1.134'
USER = 'tosito'
PASS = 'tosito13'

def run(c, cmd, sudo=False):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=20)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print('  ' + out[:400])
    if err:
        filtered = [l for l in err.splitlines() if 'password' not in l.lower() and 'contrase' not in l.lower() and 'authenticate' not in l.lower()]
        if filtered: print('  [err] ' + chr(10).join(filtered[:5]))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

# Update nexus.local nginx config to point to port 3000 (Node.js)
nginx_conf = """server {
    listen 80;
    server_name nexus.local;
    client_max_body_size 0;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade ;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host System.Management.Automation.Internal.Host.InternalHost;
        proxy_set_header X-Real-IP ;
        proxy_cache_bypass ;
        proxy_read_timeout 120s;
    }
}"""

sftp = c.open_sftp()
with sftp.file('/etc/nginx/sites-available/nexus.local', 'w') as f:
    f.write(nginx_conf)
sftp.close()

print('[1] Testing nginx config...')
run(c, 'nginx -t 2>&1', sudo=True)

print('[2] Reloading nginx...')
run(c, 'systemctl reload nginx', sudo=True)

print('[3] Final test through nginx (nexus.local resolves to 192.168.1.134)...')
run(c, 'curl -s http://127.0.0.1:3000/login 2>&1 | head -3')

print('[4] Stopping old Python nexus-api (port 3003) since Node.js takes over...')
run(c, 'systemctl disable nexus-api --now 2>&1', sudo=True)

print('[5] Services summary...')
run(c, 'systemctl is-active nexus-node && echo nexus-node:OK || echo nexus-node:FAIL')

c.close()
print('Done! nexus.local now points to the full Node.js app on port 3000.')