import paramiko
import sys
import time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(client, cmd, sudo=False):
    full_cmd = f"echo '{PASS}' | sudo -S {cmd}" if sudo else cmd
    _, stdout, stderr = client.exec_command(full_cmd)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    filtered = "\n".join(l for l in err.splitlines() if "password" not in l.lower() and "contrasena" not in l.lower() and "authenticate" not in l.lower())
    if out: print(f"  OUT: {out[:300]}")
    if filtered: print(f"  ERR: {filtered[:300]}")
    return out

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

print("=== Completing Nexus Deploy ===")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS)

print("\n[1] Installing Python packages...")
run(client, "pip3 install fastapi uvicorn python-nmap psutil netifaces --break-system-packages -q 2>&1 | tail -5", sudo=True)

print("\n[2] Setting nmap capabilities (allows scanning without full root)...")
run(client, "setcap cap_net_raw,cap_net_admin=eip /usr/bin/nmap 2>&1 || true", sudo=True)

print("\n[3] Enabling and starting service...")
run(client, "systemctl enable nexus-api 2>&1", sudo=True)
run(client, "systemctl restart nexus-api 2>&1", sudo=True)
time.sleep(4)

print("\n[4] Service status:")
status = run(client, "systemctl is-active nexus-api")
print(f"  Status: {status}")
if status != "active":
    print("  Logs:")
    run(client, "journalctl -u nexus-api -n 20 --no-pager 2>&1")

print("\n[5] Configuring Nginx for nexus.local...")
nginx_conf = """server {
    listen 80;
    server_name nexus.local;
    client_max_body_size 0;
    location /static/ {
        alias /opt/nexus/web/;
        try_files $uri $uri/ =404;
    }
    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}"""
sftp = client.open_sftp()
with sftp.file("/tmp/nexus.local", "w") as f:
    f.write(nginx_conf)
sftp.close()
run(client, "mv /tmp/nexus.local /etc/nginx/sites-available/nexus.local", sudo=True)
run(client, "ln -sf /etc/nginx/sites-available/nexus.local /etc/nginx/sites-enabled/nexus.local", sudo=True)
run(client, "nginx -t 2>&1", sudo=True)
run(client, "systemctl reload nginx 2>&1", sudo=True)

print("\n[6] Final check - API response:")
run(client, "curl -s http://127.0.0.1:3003/ 2>&1 | head -5")

client.close()
print("\n=== Done! Open http://nexus.local ===")