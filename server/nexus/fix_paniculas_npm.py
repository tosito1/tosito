import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

def run(cmd):
    _, s, _ = c.exec_command(cmd, timeout=30)
    return s.read().decode("utf-8", errors="replace").strip()

print("=== Running npm install in paniculas ===")
print(run("cd /home/tosito/nexus/paniculas && npm install"))

print("\n=== Restarting paniculas in PM2 ===")
print(run("pm2 restart paniculas"))
time.sleep(3)

print("\n=== Checking port 3001 ===")
print(run("ss -tlnp | grep 3001 || echo NOT LISTENING"))

print("\n=== pm2 logs paniculas ===")
print(run("pm2 logs paniculas --lines 10 --nostream"))

c.close()