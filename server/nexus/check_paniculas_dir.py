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

print("=== contents of paniculas ===")
print(run("ls -l /home/tosito/nexus/paniculas"))

print("\n=== pm2 dump ===")
print(run("cat /home/tosito/.pm2/dump.pm2 || echo NO DUMP"))
c.close()