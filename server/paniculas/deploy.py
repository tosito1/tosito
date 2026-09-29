import paramiko
from scp import SCPClient
import os

def create_ssh_client(server, port, user):
    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Tosito\.ssh\id_ed25519')
    client.connect(server, port, user, pkey=key)
    return client

try:
    print("Connecting...")
    ssh = create_ssh_client('192.168.1.134', 22, 'tosito')
    print("Connected.")
    
    with SCPClient(ssh.get_transport()) as scp:
        print("Uploading server.js and package.json...")
        scp.put('server.js', remote_path='/home/tosito/nexus/paniculas/')
        scp.put('package.json', remote_path='/home/tosito/nexus/paniculas/')
        scp.put('make_admin.js', remote_path='/home/tosito/nexus/paniculas/')
        print("Uploading dist folder...")
        scp.put('dist', remote_path='/home/tosito/nexus/paniculas/', recursive=True)
        
    print("Executing npm install, make_admin.js and PM2 restart...")
    stdin, stdout, stderr = ssh.exec_command('cd /home/tosito/nexus/paniculas/ && npm install && node make_admin.js && pm2 restart paniculas')
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    ssh.close()
    print("Done!")
except Exception as e:
    print(f"Error: {e}")
