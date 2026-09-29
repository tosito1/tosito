import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

def run(cmd):
    _, s, _ = c.exec_command(cmd, timeout=15)
    return s.read().decode("utf-8", errors="replace").strip()

print("=== Check if tab-tools exists ===")
print(run("grep -n 'id=\"tab-tools\"' /home/tosito/nexus/frontend/index.html || echo NOT FOUND"))

print("\n=== Check context around tab-tools ===")
print(run("grep -C 5 'id=\"tab-tools\"' /home/tosito/nexus/frontend/index.html"))

c.close()