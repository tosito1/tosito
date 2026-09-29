import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

def run(cmd, sudo=False):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, s, e = c.exec_command(full, timeout=15)
    out = s.read().decode("utf-8", errors="replace").strip()
    return out

print("=== Resurrecting PM2 ===")
print(run("pm2 resurrect"))
print(run("pm2 status"))

print("\n=== Check if there's any conflict on port 3000 ===")
# If pm2 started a 'nexus' or 'backend' app that clashes, let's delete it
print(run("pm2 delete nexus-backend 2>/dev/null || echo No nexus-backend in pm2"))
print(run("pm2 delete server 2>/dev/null || echo No server in pm2"))

print("\n=== Saving PM2 state ===")
print(run("pm2 save"))

print("\n=== Restarting PM2 startup ===")
# We re-enable PM2 systemd service so it auto-starts paniculas and monitoring
print(run("systemctl enable pm2-tosito", sudo=True))
print(run("systemctl start pm2-tosito", sudo=True))

print("\n=== Check port 3001 (paniculas) ===")
time.sleep(3)
print(run("ss -tlnp | grep 3001 || echo 3001 NOT LISTENING"))

c.close()