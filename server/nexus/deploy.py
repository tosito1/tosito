import paramiko
import os

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

# Files to upload
BACKEND_FILES = ["main.py", "scanner.py", "history.py", "alerts.py", "requirements.txt"]
FRONTEND_FILES = ["index.html", "style.css", "app.js"]
SERVICE_FILE = "nexus-api.service"

def run(client, cmd, sudo=False):
    full_cmd = f"echo '{PASS}' | sudo -S {cmd}" if sudo else cmd
    _, stdout, stderr = client.exec_command(full_cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    # Filter sudo password prompt from stderr
    filtered = "\n".join(l for l in err.splitlines() if "password" not in l.lower())
    if out: print(f"  OK {out}")
    if filtered: print(f"  ! {filtered}")
    return out

print("=== Nexus Network App Deploy ===")
print(f"Connecting to {HOST}...")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS)

# 1. Create directories
print("\n[1/5] Creating directories...")
run(client, "mkdir -p /opt/nexus/api /opt/nexus/web /opt/nexus/data", sudo=True)
run(client, f"chown -R {USER}:{USER} /opt/nexus", sudo=True)

# 2. Upload backend
print("\n[2/5] Uploading backend files...")
sftp = client.open_sftp()
for fname in BACKEND_FILES:
    src = os.path.join(LOCAL_DIR, fname)
    dst = f"/opt/nexus/api/{fname}"
    sftp.put(src, dst)
    print(f"  OK {fname} -> {dst}")

# 3. Upload frontend
print("\n[3/5] Uploading frontend files...")
for fname in FRONTEND_FILES:
    src = os.path.join(LOCAL_DIR, fname)
    dst = f"/opt/nexus/web/{fname}"
    sftp.put(src, dst)
    print(f"  OK {fname} -> {dst}")

# 4. Upload service & install
print("\n[4/5] Installing systemd service...")
sftp.put(os.path.join(LOCAL_DIR, SERVICE_FILE), f"/tmp/{SERVICE_FILE}")
sftp.close()
run(client, f"mv /tmp/{SERVICE_FILE} /etc/systemd/system/nexus-api.service", sudo=True)
run(client, "systemctl daemon-reload", sudo=True)

# 5. Install dependencies & start
print("\n[5/5] Installing Python dependencies and starting service...")
run(client, "apt-get install -y nmap arp-scan python3-pip 2>&1 | tail -3", sudo=True)
run(client, "pip3 install fastapi uvicorn python-nmap psutil netifaces --break-system-packages -q", sudo=True)
# Allow nmap without full root for the service
run(client, "setcap cap_net_raw,cap_net_admin=eip $(which nmap)", sudo=True)
run(client, "systemctl enable nexus-api --now", sudo=True)
run(client, "systemctl restart nexus-api", sudo=True)

import time
time.sleep(3)
status = run(client, "systemctl is-active nexus-api")
print(f"\nService status: {status}")

# 6. Nginx config
print("\n[6/6] Configuring Nginx for nexus.local...")
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
    }
}"""
sftp = client.open_sftp()
with sftp.file("/tmp/nexus.local", "w") as f:
    f.write(nginx_conf)
sftp.close()
run(client, "mv /tmp/nexus.local /etc/nginx/sites-available/nexus.local", sudo=True)
run(client, "ln -sf /etc/nginx/sites-available/nexus.local /etc/nginx/sites-enabled/nexus.local", sudo=True)
run(client, "nginx -t", sudo=True)
run(client, "systemctl reload nginx", sudo=True)

client.close()
print("\n=== Deploy completed! ===")
print("Open: http://nexus.local")

