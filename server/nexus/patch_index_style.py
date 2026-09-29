import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

with sftp.file("/home/tosito/nexus/frontend/index.html", "r") as f:
    html = f.read().decode("utf-8", errors="replace")

# Remove the inline style from tab-tools
html = html.replace(
    '<div id="tab-tools" class="tab-content" style="display:none; padding:1.5rem;">',
    '<div id="tab-tools" class="tab-content" style="padding:1.5rem;">'
)

with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
    f.write(html)

sftp.close()
c.close()
print("Fixed inline display:none")