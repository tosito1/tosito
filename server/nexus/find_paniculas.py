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

print("=== Looking for paniculas directory ===")
print(run("find /home/tosito -maxdepth 2 -type d -name '*paniculas*' -o -name '*movies*' || echo none"))
print(run("ls -l /home/tosito/"))

print("=== Check spotitoust service? (listening on 3002) ===")
print(run("systemctl list-units --type=service | grep -i spoti"))
print(run("cat /etc/systemd/system/spotitoust.service || echo NOT FOUND"))

c.close()