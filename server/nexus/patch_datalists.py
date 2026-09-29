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

# Add datalists near the top of the body
if "<datalist id=\"device-ips\">" not in html:
    datalists = """
    <!-- Datalists for tools -->
    <datalist id="device-ips"></datalist>
    <datalist id="device-macs"></datalist>
"""
    html = html.replace("<body>", "<body>" + datalists)
    
    # 1. nmap-target
    html = html.replace('id="nmap-target" class="form-control" value="192.168.1.0/24"', 'id="nmap-target" class="form-control" list="device-ips" value="192.168.1.0/24"')
    # 2. wol-mac
    html = html.replace('id="wol-mac" class="form-control"', 'id="wol-mac" class="form-control" list="device-macs"')
    # 3. iperf3-target
    html = html.replace('id="iperf3-target" class="form-control"', 'id="iperf3-target" class="form-control" list="device-ips"')
    # 4. osint-target
    html = html.replace('id="osint-target" class="form-control"', 'id="osint-target" class="form-control" list="device-ips"')
    # 5. msf-rhosts
    html = html.replace('id="msf-rhosts" class="form-control" value="192.168.1.0/24"', 'id="msf-rhosts" class="form-control" list="device-ips" value="192.168.1.0/24"')

    with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
        f.write(html)
    print("Injected datalists into index.html")
else:
    print("Datalists already present")

sftp.close()
c.close()