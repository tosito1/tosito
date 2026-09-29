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

print("=== pm2 list details ===")
print(run("pm2 jlist | grep -o '\"name\":\"[^\"]*\",\"pm_exec_path\":\"[^\"]*\"'"))

print("\n=== pm2 logs paniculas ===")
print(run("pm2 logs paniculas --lines 20 --nostream"))

print("\n=== pm2 delete conflicts ===")
print(run("pm2 delete nexus dns_server mdns_server 2>/dev/null"))
print(run("pm2 save"))

c.close()