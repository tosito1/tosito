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

print("=== nexus-node logs ===")
print(run("journalctl -u nexus-node -n 30 --no-pager"))

c.close()