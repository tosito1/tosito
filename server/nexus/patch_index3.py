import paramiko, re

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

# Extract the injected tools_tab_html
marker_start = "<!-- ═══ TAB: Herramientas ═══ -->"
marker_end = "<!-- History sub-panel -->"

if marker_start in html:
    # We will just replace it where it is and inject before </main>
    # Actually let's just find the closing </main> or the last </div> before modals.
    
    # Wait, earlier I checked and there was no </main> in the tail of the file!
    # Where does main-content end?
    pass

# Let's see the structure of main-content
print("=== Finding where main-content ends ===")
# We can find the start of Modals
_, s, _ = c.exec_command("grep -n -B 5 '<!-- Modal: Auditoría -->' /home/tosito/nexus/frontend/index.html")
print(s.read().decode("utf-8", errors="replace"))

c.close()