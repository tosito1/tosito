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

print("=== Checking port 3001 response ===")
print(run("curl -s -I http://127.0.0.1:3001/ | head -5"))

print("\n=== pm2 logs since restart ===")
print(run("pm2 logs paniculas --lines 5 --nostream"))

c.close()