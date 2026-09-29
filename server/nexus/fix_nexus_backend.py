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

# 1. Restart the correct PM2 process
print(run("pm2 restart monitoring-dashboard"))

# 2. Check and fix Nginx timeouts
# We don't know the exact name of the nginx conf, let's list them
confs = run("ls /etc/nginx/sites-available/")
print("Available sites:", confs)

target_conf = ""
for conf in confs.split():
    if "nexus" in conf or "monitoring" in conf:
        target_conf = conf
        break

if target_conf:
    print(f"Modifying {target_conf} to add timeouts...")
    # Add proxy_read_timeout 600s; proxy_connect_timeout 600s; proxy_send_timeout 600s;
    # We will use sed to inject it into the location / block
    cmd = f"""echo tosito13 | sudo -S sed -i '/location \/ {{/a \        proxy_read_timeout 600s;\\n        proxy_connect_timeout 600s;\\n        proxy_send_timeout 600s;' /etc/nginx/sites-available/{target_conf}"""
    run(cmd)
    
    # Reload nginx
    run("echo tosito13 | sudo -S systemctl reload nginx")
    print("Nginx reloaded.")
else:
    print("Could not find the correct nginx conf.")

c.close()