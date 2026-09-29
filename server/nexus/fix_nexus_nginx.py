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

# Add timeouts to nexus.local as well
cmd = """echo tosito13 | sudo -S sed -i '/location \/ {/a \        proxy_read_timeout 600s;\\n        proxy_connect_timeout 600s;\\n        proxy_send_timeout 600s;' /etc/nginx/sites-available/nexus.local"""
run(cmd)

run("echo tosito13 | sudo -S systemctl reload nginx")
print("Reloaded Nginx for nexus.local too")
c.close()