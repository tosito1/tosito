import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd, sudo=False):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=20)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out[:400])
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

print("[1] Disable PM2 startup so it won't autostart on reboot:")
# PM2 startup is usually set via cron or systemd - disable it
run(c, "pm2 delete all 2>/dev/null || true")
run(c, "pm2 kill 2>/dev/null || true")
run(c, "systemctl disable pm2-tosito 2>/dev/null || true", sudo=True)
run(c, "systemctl stop pm2-tosito 2>/dev/null || true", sudo=True)

print("[2] Check if PM2 has any systemd service:")
print(run(c, "ls /etc/systemd/system/ | grep pm2 2>/dev/null || echo none"))

print("[3] Final service status:")
print("nexus-node:", run(c, "systemctl is-active nexus-node"))
print(run(c, "curl -s http://127.0.0.1:3000/ | head -3"))

c.close()
print("Done - PM2 disabled, nexus-node (systemd) takes over.")