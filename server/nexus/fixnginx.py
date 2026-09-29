import paramiko

HOST = '192.168.1.134'
USER = 'tosito'
PASS = 'tosito13'

def run(c, cmd, sudo=False):
    if sudo:
        full = "echo '" + PASS + "' | sudo -S " + cmd
    else:
        full = cmd
    _, stdout, stderr = c.exec_command(full, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out)
    if err:
        filtered = [l for l in err.splitlines() if 'password' not in l.lower() and 'contrase' not in l.lower() and 'authenticate' not in l.lower()]
        if filtered: print('[err]', chr(10).join(filtered))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

# Read, fix, write back the old nexus.conf
print('[1] Reading old nexus.conf...')
sftp = c.open_sftp()
with sftp.file('/home/tosito/nexus/nginx_proxies/nexus.conf', 'r') as f:
    content = f.read().decode('utf-8', errors='replace')
print('Before:', content[:200])

# Remove nexus.local from server_name (keep nexus.trocolo)
content = content.replace('server_name nexus.trocolo nexus.local;', 'server_name nexus.trocolo;')
content = content.replace('server_name nexus.local nexus.trocolo;', 'server_name nexus.trocolo;')

with sftp.file('/home/tosito/nexus/nginx_proxies/nexus.conf', 'w') as f:
    f.write(content)
sftp.close()
print('After fix saved.')

print('[2] Testing and reloading nginx...')
run(c, 'nginx -t 2>&1', sudo=True)
run(c, 'systemctl reload nginx 2>&1', sudo=True)
print('[3] Conflict resolved!')

c.close()