import paramiko, re

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

with sftp.file("/home/tosito/nexus/frontend/index.html", "r") as f:
    html = f.read().decode("utf-8", errors="replace")

# Extract tab-logs content
logs_pattern = r'<!-- ══ TAB: Actividad ══ -->\s*<div id="tab-logs" class="tab-content">\s*(.*?)\s*</div>'
match = re.search(logs_pattern, html, re.DOTALL)

if match:
    logs_content = match.group(1)
    # Remove tab-logs completely
    html = html.replace(match.group(0), "")
    
    # Inject it at the end of tab-analytics
    # tab-analytics ends with:
    #             </div>
    #         </div>
    
    analytics_end = r'(<div id="tab-analytics" class="tab-content">.*?</div>\s*</div>\s*</div>)'
    match_analytics = re.search(analytics_end, html, re.DOTALL)
    if match_analytics:
        # We want to inject it inside tab-analytics, before its final closing div.
        # Actually, let's just find the exact end of tab-analytics:
        #             </div>
        #         </div>
        # 
        #         <!-- ══ TAB: Tráfico Web (DNS) ══ -->
        target = "        </div>\n\n        <!-- ══ TAB: Tráfico Web (DNS) ══ -->"
        if target in html:
            # logs_content is:
            # <div class="section-header">
            #     <h3>Registro de Actividad</h3>
            #     <p>Historial en tiempo real de conexiones y desconexiones.</p>
            # </div>
            # <div class="log-table" id="log-table"></div>
            
            injection = f"\n            <hr style='border-color:var(--border2); margin:2rem 0;'>\n            {logs_content}\n"
            html = html.replace(target, injection + target)
            
            with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
                f.write(html)
            print("Successfully merged tab-logs into tab-analytics")
        else:
            print("Could not find the end of tab-analytics")
    else:
        print("Could not parse tab-analytics")
else:
    print("Could not find tab-logs")

sftp.close()
c.close()