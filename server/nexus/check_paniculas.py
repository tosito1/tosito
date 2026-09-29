import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

def run(cmd):
    _, s, _ = c.exec_command(cmd, timeout=15)
    return s.read().decode("utf-8", errors="replace").strip()

print("=== nginx config for paniculas ===")
print(run("cat /etc/nginx/sites-available/paniculas.local || echo NOT FOUND"))

print("\n=== all nginx sites ===")
print(run("ls -l /etc/nginx/sites-enabled/"))

print("\n=== pm2 status (maybe it was running on pm2?) ===")
print(run("pm2 status || echo NO PM2"))

print("\n=== systemctl services for paniculas ===")
print(run("systemctl list-units --type=service | grep -i paniculas || echo NO SYSTEMD SERVICE"))

print("\n=== active node processes ===")
print(run("ps aux | grep node | grep -v grep"))

print("\n=== listening ports ===")
print(run("ss -tlnp"))

c.close()