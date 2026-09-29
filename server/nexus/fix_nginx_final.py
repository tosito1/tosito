import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd, sudo=False):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=30)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out[:500])
    if err:
        f = [l for l in err.splitlines() if "password" not in l.lower() and "contrase" not in l.lower() and "authenticate" not in l.lower()]
        if f: print("[err]", "\n".join(f[:4]))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

# Write correct nginx config via sftp (no shell variable expansion issues)
conf = "\n".join([
    "server {",
    "    listen 80;",
    "    server_name nexus.local;",
    "    client_max_body_size 0;",
    "    location / {",
    "        proxy_pass http://127.0.0.1:3000;",
    "        proxy_http_version 1.1;",
    '        proxy_set_header Upgrade $http_upgrade;',
    '        proxy_set_header Connection "upgrade";',
    '        proxy_set_header Host $host;',
    '        proxy_set_header X-Real-IP $remote_addr;',
    '        proxy_cache_bypass $http_upgrade;',
    "        proxy_read_timeout 120s;",
    "    }",
    "}",
])

# Write to /tmp first (sftp as tosito), then sudo mv
sftp = c.open_sftp()
with sftp.file("/tmp/nexus_nginx.conf", "w") as f:
    f.write(conf)
sftp.close()
print("Wrote config to /tmp")
print(run(c, "cat /tmp/nexus_nginx.conf"))

run(c, "mv /tmp/nexus_nginx.conf /etc/nginx/sites-available/nexus.local", sudo=True)
print("Moved to sites-available")
print("[nginx -t]")
print(run(c, "nginx -t 2>&1", sudo=True))
run(c, "systemctl reload nginx 2>&1", sudo=True)
print("Nginx reloaded OK")

# Restart nexus-node
run(c, "systemctl restart nexus-node 2>&1", sudo=True)
time.sleep(6)
status = run(c, "systemctl is-active nexus-node")
print("nexus-node:", status)
if "active" not in status:
    print(run(c, "journalctl -u nexus-node -n 20 --no-pager"))

print(run(c, "curl -s http://127.0.0.1:3000/ | head -5"))
c.close()
print("DONE - nexus.local -> port 3000 (Node.js full app)")