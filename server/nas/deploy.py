import paramiko
from scp import SCPClient
import os
import shutil
import sys

def create_ssh_client(server, port, user):
    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    # Intenta usar la clave ed25519 igual que en paniculas
    key_path = r'C:\Users\Tosito\.ssh\id_ed25519'
    try:
        key = paramiko.Ed25519Key.from_private_key_file(key_path)
        client.connect(server, port, user, pkey=key)
    except Exception as e:
        print(f"No se pudo usar la clave SSH: {e}. Asegúrate de tener acceso SSH configurado o usa deploy.ps1 si prefieres escribir la contraseña.")
        # Fallback a password podria hacerse pero requeriria input
        raise
    return client

def deploy():
    server_ip = '192.168.1.134'
    username = 'tosito'
    remote_dir = '/home/tosito/nas_app'
    
    print(f"Conectando a {server_ip}...")
    try:
        ssh = create_ssh_client(server_ip, 22, username)
        print("Conectado.")
        
        # Crear directorio remoto si no existe
        ssh.exec_command(f'mkdir -p {remote_dir}')
        
        with SCPClient(ssh.get_transport()) as scp:
            print("Subiendo archivos (esto puede tardar unos momentos)...")
            # Subir archivos esenciales
            files_to_upload = ['package.json', 'next.config.ts', 'tsconfig.json', '.env.local', 'eslint.config.mjs']
            for file in files_to_upload:
                if os.path.exists(file):
                    print(f"Subiendo {file}...")
                    scp.put(file, remote_path=f'{remote_dir}/')
            
            # Subir carpetas esenciales
            folders_to_upload = ['src', 'public', 'storage']
            for folder in folders_to_upload:
                if os.path.exists(folder):
                    print(f"Subiendo carpeta {folder}...")
                    scp.put(folder, remote_path=f'{remote_dir}/', recursive=True)
            
        print("Ejecutando npm install, build y PM2 restart en el servidor...")
        # Comando para instalar, build y reiniciar
        command = f'cd {remote_dir} && npm install && npm run build && (pm2 restart nas-app || pm2 start npm --name "nas-app" -- start) && pm2 save'
        
        stdin, stdout, stderr = ssh.exec_command(command)
        
        # Leer salida en tiempo real
        for line in iter(stdout.readline, ""):
            print(line.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding), end="")
            
        err = stderr.read().decode(sys.stdout.encoding, errors='replace')
        if err:
            print("Advertencias/Errores:")
            print(err)
        
        ssh.close()
        print("¡Despliegue finalizado exitosamente!")
    except Exception as e:
        print(f"Error durante el despliegue: {e}")

if __name__ == "__main__":
    deploy()
