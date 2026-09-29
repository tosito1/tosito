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

# Fix 1: Remove dangling log-table and stray </div>
dangling = """        
            <div class="log-table" id="log-table"></div>
        </div>

        <!-- ══ TAB: Analytics ══ -->"""
if dangling in html:
    html = html.replace(dangling, "        <!-- ══ TAB: Analytics ══ -->")
    print("Removed dangling log-table")
else:
    # try looser match
    dangling2 = """<div class="log-table" id="log-table"></div>\n        </div>\n\n        <!-- ══ TAB: Analytics ══ -->"""
    if dangling2 in html:
        html = html.replace(dangling2, "<!-- ══ TAB: Analytics ══ -->")
        print("Removed dangling log-table (loose match 1)")
    else:
        # just regex remove it
        html = re.sub(r'<div class="log-table" id="log-table"></div>\s*</div>\s*<!-- ══ TAB: Analytics ══ -->', '<!-- ══ TAB: Analytics ══ -->', html)
        print("Regex removed dangling log-table")

# Fix 2: Inject log-table into Analytics correctly
target = """<p>Historial en tiempo real de conexiones y desconexiones.</p>\n        </div>\n\n        <!-- ══ TAB: Tráfico Web (DNS) ══ -->"""
if target in html:
    html = html.replace(target, """<p>Historial en tiempo real de conexiones y desconexiones.</p>\n            </div>\n            <div class="log-table" id="log-table"></div>\n\n        <!-- ══ TAB: Tráfico Web (DNS) ══ -->""")
    print("Injected log-table into Analytics")
else:
    # fallback
    html = html.replace("<p>Historial en tiempo real de conexiones y desconexiones.</p>\n        </div>", "<p>Historial en tiempo real de conexiones y desconexiones.</p>\n        </div>\n        <div class=\"log-table\" id=\"log-table\"></div>")
    print("Injected log-table (fallback)")

with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
    f.write(html)
print("Finished patching html corruption")

sftp.close()
c.close()