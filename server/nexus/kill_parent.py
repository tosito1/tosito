import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd, sudo=False):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=20)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out[:500])
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

print("[1] Kill parent process 3944 and all its children:")
print(run(c, "ps -p 3944 -o pid,ppid,user,cmd --no-headers 2>/dev/null || echo 'PID 3944 not found'", sudo=True))
run(c, "kill -9 3944 2>/dev/null || true", sudo=True)
run(c, "pkill -9 -f 'node.*server.js' 2>/dev/null || true", sudo=True)
time.sleep(2)

print("[2] Port 3000 after kill:")
print(run(c, "ss -tlnp | grep 3000 || echo FREE"))

if "FREE" in run(c, "ss -tlnp | grep 3000 || echo FREE"):
    print("[3] Port is free! Starting nexus-node service...")
    run(c, "systemctl start nexus-node 2>&1", sudo=True)
    time.sleep(6)
    status = run(c, "systemctl is-active nexus-node")
    print("Status:", status)
    if "active" in status:
        print(run(c, "curl -sL http://127.0.0.1:3000/ | head -5"))
        print("SUCCESS!")
    else:
        print(run(c, "journalctl -u nexus-node -n 20 --no-pager"))
else:
    print("[3] Port still occupied - checking who:")
    print(run(c, "ss -tlnp | grep 3000", sudo=True))
    print(run(c, "lsof -i :3000 2>/dev/null", sudo=True))

c.close()