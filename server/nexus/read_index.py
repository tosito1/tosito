import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

def run(cmd):
    _, s, _ = c.exec_command(cmd, timeout=15)
    return s.read().decode("utf-8", errors="replace")

print("=== top of index.html ===")
print(run("head -40 /home/tosito/nexus/frontend/index.html"))

print("=== end of nav ===")
print(run("grep -A 20 -n 'nav-links' /home/tosito/nexus/frontend/index.html"))

c.close()