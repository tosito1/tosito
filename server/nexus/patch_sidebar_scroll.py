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

old_nav = """.nav-links {
    list-style: none;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}"""

new_nav = """.nav-links {
    list-style: none;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
}
.nav-links::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
}"""

if old_nav in css:
    css = css.replace(old_nav, new_nav)
    with sftp.file("/home/tosito/nexus/frontend/style.css", "w") as f:
        f.write(css)
    print("Added scroll to nav-links")
else:
    print("Could not find .nav-links block in style.css")

sftp.close()
c.close()