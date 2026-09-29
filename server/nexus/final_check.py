import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd, sudo=False, timeout=30):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=timeout)
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

print("=== Metasploit status ===")
msf_path = run(c, "which msfconsole 2>/dev/null || find /opt /usr/local -name msfconsole -type f 2>/dev/null | head -3", sudo=True)
print("msfconsole:", msf_path if msf_path else "NOT INSTALLED")

# If MSF not found, try to install via snap (alternative)
if not msf_path or "NOT" in msf_path:
    print("Metasploit not installed yet. Installing via snap as fallback...")
    run(c, "snap install metasploit-framework 2>&1 | tail -5", sudo=True, timeout=120)
    msf_path = run(c, "which msfconsole 2>/dev/null || snap run metasploit-framework.msfconsole --version 2>/dev/null | head -1 || echo NOT_FOUND")
    print("After snap install:", msf_path)

print()
print("=== nexus-node service ===")
print(run(c, "systemctl is-active nexus-node"))

print()
print("=== Quick test: nmap against localhost ===")
print(run(c, "nmap -sV -T4 --top-ports 10 --open 127.0.0.1 2>&1 | tail -15"))

print()
print("=== arp-scan test ===")
print(run(c, "arp-scan 192.168.1.0/24 2>&1 | head -10", sudo=True, timeout=30))

print()
print("=== Tools endpoints test ===")
# Test nmap endpoint (no auth for quick verify the route exists)
print(run(c, "curl -s http://127.0.0.1:3000/api/tools/msf/modules -H 'Cookie: session=fake' 2>&1 | head -3"))

c.close()