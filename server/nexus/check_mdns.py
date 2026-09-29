import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd, sudo=False):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=15)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out[:600])
    if err:
        f = [l for l in err.splitlines() if "password" not in l.lower() and "contrase" not in l.lower() and "authenticate" not in l.lower()]
        if f: print("[err]", "\n".join(f[:3]))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

print("=== mdns_server.js ===")
print(run(c, "cat /home/tosito/nexus/backend/mdns_server.js"))

print("\n=== Avahi daemon status ===")
print(run(c, "systemctl is-active avahi-daemon"))
print(run(c, "avahi-browse -a --terminate 2>/dev/null | grep -i nexus | head -5 || echo 'no nexus entries'"))

print("\n=== Port 53 (DNS) ===")
print(run(c, "ss -tlunp | grep ':53 ' | head -5"))
print(run(c, "ss -tulnp | grep ':5353' | head -5"))  # mDNS port

print("\n=== Avahi config ===")
print(run(c, "cat /etc/avahi/avahi-daemon.conf | grep -v '^#' | grep -v '^$'", sudo=True))

print("\n=== Avahi services files ===")
print(run(c, "ls /etc/avahi/services/ 2>/dev/null || echo empty"))

print("\n=== Test resolution from server itself ===")
print(run(c, "avahi-resolve -n nexus.local 2>/dev/null || echo 'cannot resolve nexus.local'"))
print(run(c, "avahi-resolve -n nas.local 2>/dev/null || echo 'cannot resolve nas.local'"))

c.close()