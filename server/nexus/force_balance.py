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

# Let's fix the end of tab-tools
# We want exactly two </div> before "<!-- Modal: Gráfica de latencia -->"
# One to close tab-tools, one to close main-content.
import re
html = re.sub(r'((?:</div>\s*)+)(?=<!-- Modal: Gráfica de latencia -->)', '        </div>\n    </div>\n\n    ', html)

with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
    f.write(html)

print("Forced exactly 2 closing divs before the modal.")

sftp.close()
c.close()