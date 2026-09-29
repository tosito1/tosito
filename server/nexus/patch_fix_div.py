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

# The problem is that tab-settings is missing a closing </div> before tab-tools.
# Let's check how many </div> are right before <!-- ═══ TAB: Herramientas ═══ -->
search_str = "            </div>\n\n<!-- ═══ TAB: Herramientas ═══ -->"
if search_str in html:
    html = html.replace(search_str, "            </div>\n        </div>\n\n<!-- ═══ TAB: Herramientas ═══ -->")
    with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
        f.write(html)
    print("Fixed missing </div>")
else:
    # try another format
    print("Could not find exactly that string. Let's do a more robust replace.")
    html = html.replace("\n<!-- ═══ TAB: Herramientas ═══ -->", "\n        </div>\n\n<!-- ═══ TAB: Herramientas ═══ -->")
    
    # We also need to remove one </div> at the end of tab-tools because we added one before it,
    # and the total number of </div> at the end is 2 (one for tab-tools, one for main-content).
    # Wait, tab-tools closes with </div>. Then there should be </div> for main-content.
    # Currently, at the end of tab-tools we have:
    #             <!-- History sub-panel -->
    #             ...
    #             </div>
    #         </div>
    #         </div>
    #     </div>
    # 
    #     <!-- Modal: Gráfica de latencia -->
    
    # Let's just fix it by replacing the whole tab-settings closing.

sftp.close()
c.close()