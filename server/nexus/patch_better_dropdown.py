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

# 1. NMAP
old_nmap = '<input id="nmap-target" class="form-control" list="device-ips" value="192.168.1.0/24" placeholder="192.168.1.1 o subred">'
new_nmap = """<div style="display:flex; gap:0.5rem;">
                                <input id="nmap-target" class="form-control" style="flex:1;" value="192.168.1.0/24" placeholder="192.168.1.1 o subred">
                                <select class="form-control device-ip-select" style="width:140px; background:rgba(0,0,0,0.3); color:var(--primary);" onchange="document.getElementById('nmap-target').value=this.value; this.selectedIndex=0;">
                                    <option value="" disabled selected>🔽 Red local</option>
                                </select>
                            </div>"""
html = html.replace(old_nmap, new_nmap)

# 2. WOL
old_wol = '<input id="wol-mac" class="form-control" list="device-macs" placeholder="AA:BB:CC:DD:EE:FF">'
new_wol = """<div style="display:flex; gap:0.5rem;">
                            <input id="wol-mac" class="form-control" style="flex:1;" placeholder="AA:BB:CC:DD:EE:FF">
                            <select class="form-control device-mac-select" style="width:180px; background:rgba(0,0,0,0.3); color:var(--primary);" onchange="document.getElementById('wol-mac').value=this.value; this.selectedIndex=0;">
                                <option value="" disabled selected>🔽 Seleccionar PC...</option>
                            </select>
                        </div>"""
html = html.replace(old_wol, new_wol)

# 3. IPERF3
old_iperf3 = '<input id="iperf3-target" class="form-control" list="device-ips" placeholder="192.168.1.5">'
new_iperf3 = """<div style="display:flex; gap:0.5rem;">
                            <input id="iperf3-target" class="form-control" style="flex:1;" placeholder="192.168.1.5">
                            <select class="form-control device-ip-select" style="width:180px; background:rgba(0,0,0,0.3); color:var(--primary);" onchange="document.getElementById('iperf3-target').value=this.value; this.selectedIndex=0;">
                                <option value="" disabled selected>🔽 Seleccionar PC...</option>
                            </select>
                        </div>"""
html = html.replace(old_iperf3, new_iperf3)

# 4. OSINT
old_osint = '<input id="osint-target" class="form-control" list="device-ips" placeholder="google.com">'
new_osint = """<input id="osint-target" class="form-control" placeholder="google.com">""" # Just remove datalist for OSINT
html = html.replace(old_osint, new_osint)

# 5. MSF
old_msf = '<input id="msf-rhosts" class="form-control" list="device-ips" value="192.168.1.0/24">'
new_msf = """<div style="display:flex; gap:0.5rem;">
                            <input id="msf-rhosts" class="form-control" style="flex:1;" value="192.168.1.0/24">
                            <select class="form-control device-ip-select" style="width:140px; background:rgba(0,0,0,0.3); color:var(--primary);" onchange="document.getElementById('msf-rhosts').value=this.value; this.selectedIndex=0;">
                                <option value="" disabled selected>🔽 Red local</option>
                            </select>
                        </div>"""
html = html.replace(old_msf, new_msf)

with sftp.file("/home/tosito/nexus/frontend/index.html", "w") as f:
    f.write(html)
print("Updated index.html with explicit select dropdowns")

# --- Now update app.js ---
with sftp.file("/home/tosito/nexus/frontend/app.js", "r") as f:
    js = f.read().decode("utf-8", errors="replace")

# We replace renderDatalists logic with renderDeviceSelects
old_func_start = "function renderDatalists() {"
old_func_end = "listMacs.innerHTML = macsHtml;\n}"

if old_func_start in js:
    js_pre = js.split(old_func_start)[0]
    js_post = js.split(old_func_end)[1]
    
    new_func = """function renderDatalists() {
    const ipSelects = document.querySelectorAll(".device-ip-select");
    const macSelects = document.querySelectorAll(".device-mac-select");

    let ipsHtml = '<option value="" disabled selected>🔽 Dispositivos...</option>';
    let macsHtml = '<option value="" disabled selected>🔽 Dispositivos...</option>';

    // Sort devices by name or IP
    const devs = Array.from(devices.values()).sort((a,b) => {
        let nameA = (a.customName || a.name || "").toLowerCase();
        let nameB = (b.customName || b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
    });

    devs.forEach(d => {
        const name = d.customName || d.name || "Desconocido";
        // Create an intuitive string: "Laptop (192.168.1.5)"
        const labelIp = `📱 ${name.substring(0, 20)} [${d.ip}]`;
        ipsHtml += `<option value="${d.ip}">${labelIp}</option>`;
        
        if (d.mac) {
            const labelMac = `📱 ${name.substring(0, 20)} [${d.mac.substring(0,8)}...]`;
            macsHtml += `<option value="${d.mac}">${labelMac}</option>`;
        }
    });

    ipSelects.forEach(sel => {
        const curr = sel.value;
        sel.innerHTML = ipsHtml;
        sel.value = ""; // Reset to placeholder
    });
    macSelects.forEach(sel => {
        const curr = sel.value;
        sel.innerHTML = macsHtml;
        sel.value = "";
    });
}"""

    js = js_pre + new_func + js_post
    with sftp.file("/home/tosito/nexus/frontend/app.js", "w") as f:
        f.write(js)
    print("Updated app.js renderDatalists logic")

sftp.close()
c.close()