import paramiko
from scp import SCPClient
import os

nginx_conf = """
server {
    listen 80;
    server_name spotitoust.local;

    root /var/www/spotitoust;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
"""

def deploy():
    server_ip = '192.168.1.134'
    username = 'tosito'
    password = 'tosito13'
    
    print(f"Conectando a {server_ip}...")
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(server_ip, username=username, password=password)
        print("Conectado.")
        
        # Subir carpeta dist recursivamente
        with SCPClient(client.get_transport()) as scp:
            print("Subiendo carpeta dist/ ...")
            scp.put('dist', remote_path='/tmp/', recursive=True)
            
        # Subir config Nginx
        sftp = client.open_sftp()
        with sftp.file('/tmp/spotitoust.local', 'w') as f:
            f.write(nginx_conf)
        sftp.close()
        
        print("Configurando Nginx y moviendo archivos a /var/www...")
        cmds = [
            # Mover la carpeta compilada
            f"echo '{password}' | sudo -S rm -rf /var/www/spotitoust",
            f"echo '{password}' | sudo -S mv /tmp/dist /var/www/spotitoust",
            f"echo '{password}' | sudo -S chown -R www-data:www-data /var/www/spotitoust",
            
            # Configurar Nginx
            f"echo '{password}' | sudo -S mv /tmp/spotitoust.local /etc/nginx/sites-available/spotitoust.local",
            f"echo '{password}' | sudo -S ln -sf /etc/nginx/sites-available/spotitoust.local /etc/nginx/sites-enabled/spotitoust.local",
            f"echo '{password}' | sudo -S systemctl reload nginx"
        ]
        
        for cmd in cmds:
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.read() # Esperar a que termine
            
        client.close()
        print("¡Spotitoust desplegado y Nginx configurado exitosamente!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    deploy()
