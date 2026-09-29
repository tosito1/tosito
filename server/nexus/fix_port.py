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
    if err:
        f = [l for l in err.splitlines() if "password" not in l.lower() and "contrase" not in l.lower() and "authenticate" not in l.lower()]
        if f: print("[err]", "\n".join(f[:4]))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

print("[1] What is using port 3000?")
print(run(c, "ss -tlnp | grep 3000"))
print(run(c, "lsof -i :3000 -t 2>/dev/null || true", sudo=True))

print("[2] Kill whatever is on port 3000...")
run(c, "fuser -k 3000/tcp 2>/dev/null || true", sudo=True)
time.sleep(2)

print("[3] Start nexus-node service...")
run(c, "systemctl start nexus-node 2>&1", sudo=True)
time.sleep(6)

status = run(c, "systemctl is-active nexus-node")
print("Status:", status)

if "active" not in status:
    print(run(c, "journalctl -u nexus-node -n 15 --no-pager"))
else:
    print(run(c, "curl -sL http://127.0.0.1:3000/ | head -4"))
    print("SUCCESS - nexus.local full app is running!")

c.close()