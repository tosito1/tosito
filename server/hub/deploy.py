import paramiko
from scp import SCPClient
import os

nginx_conf = """
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/hub_app;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
"""

def deploy():
    server_ip = '192.168.1.134'
    username = 'tosito'
    remote_tmp = '/tmp/hub_app'
    
    print(f"Conectando a {server_ip}...")
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(server_ip, username=username, password='tosito13')
        print("Conectado.")
        
        client.exec_command(f'mkdir -p {remote_tmp}')
        
        with SCPClient(client.get_transport()) as scp:
            print("Subiendo archivos estáticos...")
            scp.put('index.html', remote_path=f'{remote_tmp}/')
            scp.put('index.css', remote_path=f'{remote_tmp}/')
            scp.put('script.js', remote_path=f'{remote_tmp}/')
        
        sftp = client.open_sftp()
        with sftp.file('/tmp/default', 'w') as f:
            f.write(nginx_conf)
        sftp.close()
        
        print("Actualizando Nginx (catch-all) y moviendo archivos a /var/www...")
        cmds = [
            "echo 'tosito13' | sudo -S rm -rf /var/www/hub_app",
            "echo 'tosito13' | sudo -S mv /tmp/hub_app /var/www/",
            "echo 'tosito13' | sudo -S chown -R www-data:www-data /var/www/hub_app",
            "echo 'tosito13' | sudo -S mv /tmp/default /etc/nginx/sites-available/default",
            "echo 'tosito13' | sudo -S systemctl reload nginx"
        ]
        
        for cmd in cmds:
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.read()
            
        client.close()
        print("¡Hub desplegado y Nginx configurado exitosamente!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    deploy()
