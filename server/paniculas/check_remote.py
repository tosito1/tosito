import paramiko

client = paramiko.SSHClient()
client.load_system_host_keys()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Tosito\.ssh\id_ed25519')
client.connect('192.168.1.134', 22, 'tosito', pkey=key)

cmd = """cd /home/tosito/nexus/paniculas && node -e "const sqlite3 = require('sqlite3'); const db = new sqlite3.Database('database.sqlite'); db.all('SELECT * FROM users', (err, rows) => console.log(rows));" """
stdin, stdout, stderr = client.exec_command(cmd)

print("STDOUT:")
print(stdout.read().decode('utf-8', errors='ignore'))
print("STDERR:")
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
