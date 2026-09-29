import paramiko

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()
sftp.get("/home/tosito/nexus/frontend/index.html", "c:\\Users\\Tosito\\Desktop\\Tosito\\server\\nexus\\index_downloaded.html")
sftp.close()
c.close()
print("Downloaded index.html")