import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

with sftp.file("/home/tosito/nexus/frontend/style.css", "r") as f:
    css = f.read().decode("utf-8", errors="replace")

new_css = """
/* ── Sidebar Categories ── */
.sidebar-category {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin: 1.5rem 0 0.5rem 1.5rem;
    font-weight: 600;
    opacity: 0.7;
}
"""

if ".sidebar-category" not in css:
    css += "\n" + new_css
    with sftp.file("/home/tosito/nexus/frontend/style.css", "w") as f:
        f.write(css)
    print("Injected .sidebar-category into style.css")
else:
    print(".sidebar-category already exists")

sftp.close()
c.close()