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

import re
html = html.replace('        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->', '        </div>\n        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->')

with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
    f.write(html)

sftp.close()
c.close()
print("Added 1 more closing div")