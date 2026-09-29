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

out = run("cat /home/tosito/nexus/frontend/index.html")
divs_open = out.count("<div")
divs_close = out.count("</div")
print(f"Total Open: {divs_open}, Total Close: {divs_close}")

c.close()