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

# Get the top of server.js (requires and initial setup)
print("=== TOP 40 lines ===")
print(run("head -40 /home/tosito/nexus/backend/server.js"))
print("=== LAST 30 lines ===")
print(run("tail -30 /home/tosito/nexus/backend/server.js"))
print("=== database.js last 30 ===")
print(run("tail -30 /home/tosito/nexus/backend/database.js"))

c.close()