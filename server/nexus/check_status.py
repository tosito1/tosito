import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd, sudo=False):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=15)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out[:500])
    if err:
        f = [l for l in err.splitlines() if "password" not in l.lower() and "contrase" not in l.lower() and "authenticate" not in l.lower()]
        if f: print("[err]", "\n".join(f[:3]))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

print("=== nexus-node ===")
print(run(c, "systemctl is-active nexus-node"))
print(run(c, "systemctl status nexus-node --no-pager -n 10"))

print("\n=== nginx ===")
print(run(c, "systemctl is-active nginx"))

print("\n=== port 3000 ===")
print(run(c, "ss -tlnp | grep 3000 || echo FREE"))

print("\n=== port 80 ===")
print(run(c, "ss -tlnp | grep ':80 ' || echo FREE"))

print("\n=== last nexus-node logs ===")
print(run(c, "journalctl -u nexus-node -n 20 --no-pager"))

c.close()