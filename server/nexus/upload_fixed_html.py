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

# 1. We must close tab-settings BEFORE tab-tools.
# The end of settings-grid is at line 641 (approx). Let's find "<!-- ═══ TAB: Herramientas ═══ -->"
marker = "<!-- ═══ TAB: Herramientas ═══ -->"
if marker in html:
    # insert </div> before the marker
    html = html.replace(marker, "</div>\n\n" + marker)
    
# 2. We must remove the extra </div> at the end of tab-tools.
# Currently we have:
#         </div>
# 
#         </div>
#     </div>
# 
#     <!-- Modal: Gráfica de latencia -->

# Let's replace the block before the modal
old_end = "        </div>\n\n        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->"
new_end = "        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->"
if old_end in html:
    html = html.replace(old_end, new_end)
else:
    # try another variation
    old_end2 = "        </div>\n        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->"
    if old_end2 in html:
        html = html.replace(old_end2, new_end)

with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
    f.write(html)

sftp.close()
c.close()
print("Fixed nested div structure")