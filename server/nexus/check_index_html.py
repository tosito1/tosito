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

print("=== Checking index.html for tools tab ===")
print(run("grep -i 'Herramientas' /home/tosito/nexus/frontend/index.html || echo 'NOT FOUND'"))

print("\n=== Check structure of nav ===")
print(run("cat /home/tosito/nexus/frontend/index.html | grep -B 2 -A 5 'class=\"nav-links\"' || echo 'No nav-links'"))

print("\n=== Check if tab content exists ===")
print(run("grep -i 'id=\"tab-tools\"' /home/tosito/nexus/frontend/index.html || echo 'NO TAB CONTENT'"))

c.close()