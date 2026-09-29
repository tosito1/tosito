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

# We want to replace:
#         </div>
# 
# </div>
# 
# <!-- ═══ TAB: Herramientas ═══ -->
# 
# WITH:
#         </div>
# 
# <!-- ═══ TAB: Herramientas ═══ -->
#
# AND THEN we add the removed </div> to the end marker.

target = "        </div>\n\n</div>\n\n<!-- ═══ TAB: Herramientas ═══ -->"
if target in html:
    html = html.replace(target, "        </div>\n\n<!-- ═══ TAB: Herramientas ═══ -->")
    
    end_marker = "        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->"
    html = html.replace(end_marker, "</div>\n" + end_marker)
    
    with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
        f.write(html)
    print("Fixed layout bug: moved main-content closing div to the end.")
else:
    print("Could not find the target string.")

sftp.close()
c.close()