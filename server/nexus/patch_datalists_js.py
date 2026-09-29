import paramiko, re

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)
sftp = c.open_sftp()

with sftp.file("/home/tosito/nexus/frontend/app.js", "r") as f:
    js = f.read().decode("utf-8", errors="replace")

new_func = """
function renderDatalists() {
    const listIps = document.getElementById("device-ips");
    const listMacs = document.getElementById("device-macs");
    if (!listIps || !listMacs) return;

    let ipsHtml = '<option value="192.168.1.0/24">Subred Local (192.168.1.0/24)</option>';
    let macsHtml = '';

    devices.forEach(d => {
        const name = d.customName || d.name || "Dispositivo";
        ipsHtml += `<option value="${d.ip}">${name} (${d.ip})</option>`;
        if (d.mac) {
            macsHtml += `<option value="${d.mac}">${name} (${d.mac})</option>`;
        }
    });

    listIps.innerHTML = ipsHtml;
    listMacs.innerHTML = macsHtml;
}
"""

if "renderDatalists" not in js:
    # insert function
    js += "\n" + new_func
    
    # inject into renderAll
    js = js.replace("renderProfilesGrid();", "renderProfilesGrid();\n    renderDatalists();")

    with sftp.file("/home/tosito/nexus/frontend/app.js", "w") as f:
        f.write(js)
    print("Injected renderDatalists into app.js")
else:
    print("renderDatalists already present")

sftp.close()
c.close()