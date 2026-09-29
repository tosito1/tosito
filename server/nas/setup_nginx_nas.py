import paramiko

nginx_conf = """
server {
    listen 80;
    server_name nas.local;
    client_max_body_size 0;
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
"""

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.1.134', username='tosito', password='tosito13')

# Write to temp file
sftp = client.open_sftp()
with sftp.file('/tmp/nas.local', 'w') as f:
    f.write(nginx_conf)
sftp.close()

# Move to sites-available and link
cmds = [
    "echo 'tosito13' | sudo -S mv /tmp/nas.local /etc/nginx/sites-available/nas.local",
    "echo 'tosito13' | sudo -S ln -sf /etc/nginx/sites-available/nas.local /etc/nginx/sites-enabled/nas.local",
    "echo 'tosito13' | sudo -S systemctl reload nginx"
]

for cmd in cmds:
    print(f"Running: {cmd.replace('tosito13', '****')}")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode())
    print(stderr.read().decode())

client.close()
print("Done configuring Nginx for NAS!")
