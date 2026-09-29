import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

print("[1] Reading index.html...")
with sftp.file("/home/tosito/nexus/frontend/index.html", "r") as f:
    html = f.read().decode("utf-8", errors="replace")

# The tools tab is currently right before <script src="/socket.io/socket.io.js">
tools_start = "<!-- ═══ TAB: Herramientas ═══ -->"
tools_end = "<!-- History sub-panel -->"

if tools_start in html:
    # Find the end of the tools tab
    start_idx = html.find(tools_start)
    end_marker = '</div>\n        </div>\n'
    end_idx = html.find(end_marker, html.find(tools_end)) + len(end_marker)
    
    tools_html = html[start_idx:end_idx]
    
    # Remove it from its current position
    html = html[:start_idx] + html[end_idx:]
    
    # Find the correct insertion point: right before the 2 closing divs before latency modal
    insert_marker = "        </div>\n    </div>\n\n    <!-- Modal: Gráfica de latencia -->"
    
    if insert_marker in html:
        html = html.replace(insert_marker, "\n" + tools_html + "\n" + insert_marker)
        with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
            f.write(html)
        print("  Successfully moved tab-tools inside main-content")
    else:
        print("  Could not find insertion marker")
else:
    print("  tools_start not found")

sftp.close()
c.close()