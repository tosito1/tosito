import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

def run(cmd):
    _, s, e = c.exec_command(cmd, timeout=30)
    return s.read().decode("utf-8", errors="replace").strip()

print(run("sed -n '/<div id=\"sub-nmap\"/,/<\/div>/p' /home/tosito/nexus/frontend/index.html | head -n 10"))

c.close()