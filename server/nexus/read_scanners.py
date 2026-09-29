import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd):
    _, stdout, _ = c.exec_command(cmd, timeout=15)
    return stdout.read().decode("utf-8", errors="replace").strip()

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

print("=== scanner.js ===")
print(run(c, "cat /home/tosito/nexus/backend/scanner.js"))
print()
print("=== auditor.js ===")
print(run(c, "cat /home/tosito/nexus/backend/auditor.js"))
print()
print("=== zte_router.js (first 60 lines) ===")
print(run(c, "head -60 /home/tosito/nexus/backend/zte_router.js"))
print()
print("=== nmap installed? ===")
print(run(c, "nmap --version 2>/dev/null | head -1 || echo NOT_INSTALLED"))
print(run(c, "arp-scan --version 2>/dev/null | head -1 || echo NOT_INSTALLED"))
print(run(c, "which msfconsole 2>/dev/null || echo NOT_INSTALLED"))
print()
print("=== server.js audit route ===")
print(run(c, "grep -n 'audit\\|nmap\\|arp\\|metasploit\\|msf' /home/tosito/nexus/backend/server.js | head -20"))

c.close()