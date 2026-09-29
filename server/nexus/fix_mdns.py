import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd, sudo=False):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=15)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out[:400])
    if err:
        f = [l for l in err.splitlines() if "password" not in l.lower() and "contrase" not in l.lower() and "authenticate" not in l.lower()]
        if f: print("[err]", "\n".join(f[:3]))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

# Check if mdns_server is called in server.js
with sftp.file("/home/tosito/nexus/backend/server.js", "r") as f:
    sv = f.read().decode("utf-8", errors="replace")

print("[1] mdns_server in server.js?", "mdns_server" in sv)

# Add mdns_server require inside server.listen callback if not there
if "mdns_server" not in sv:
    # Inject it in the server.listen callback
    old = "startDnsServer(db, io);"
    new = "startDnsServer(db, io);\n    // Iniciar servidor mDNS (resuelve *.local)\n    require('./mdns_server');"
    sv = sv.replace(old, new)
    with sftp.file("/home/tosito/nexus/backend/server.js", "w") as f:
        f.write(sv)
    print("  mdns_server injected into server.js")
else:
    print("  mdns_server already in server.js")

# Also create Avahi service files for each .local domain
# This makes Avahi announce them on the network
LOCAL_IP = "192.168.1.134"
services = ["nexus", "nas", "monitoring", "spotitoust", "paniculas", "hub"]

for svc in services:
    xml = f"""<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">{svc}.local HTTP</name>
  <service>
    <type>_http._tcp</type>
    <port>80</port>
  </service>
</service-group>
"""
    sftp.file(f"/tmp/avahi_{svc}.service", "w").write(xml)
    run(c, f"mv /tmp/avahi_{svc}.service /etc/avahi/services/{svc}-local.service", sudo=True)

print("[2] Avahi service files created")
run(c, "systemctl restart avahi-daemon", sudo=True)
time.sleep(2)

# Restart nexus-node to load mdns_server
print("[3] Restarting nexus-node...")
run(c, "systemctl restart nexus-node", sudo=True)
time.sleep(6)
print(run(c, "systemctl is-active nexus-node"))

# Test mDNS resolution from server itself
print("[4] Testing mDNS resolution...")
time.sleep(3)
print(run(c, "avahi-resolve -n nexus.local 2>/dev/null || echo 'still not resolving'"))
print(run(c, "avahi-resolve -n nas.local 2>/dev/null || echo 'still not resolving'"))

sftp.close()
c.close()
print("DONE")