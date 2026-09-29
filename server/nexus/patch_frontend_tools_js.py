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

new_js = """
// ── Wake-on-LAN ──────────────────────────────────────────────
async function runWol() {
    const mac = document.getElementById("wol-mac").value.trim();
    if (!mac) return alert("Introduce una dirección MAC válida.");
    const btn = document.getElementById("wol-btn");
    btn.disabled = true; btn.textContent = "⏳ Enviando paquete...";
    document.getElementById("wol-status").textContent = "Enviando Magic Packet a " + mac + "...";

    try {
        const res = await fetch("/api/tools/wol", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ mac })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        document.getElementById("wol-status").innerHTML = `<span style="color:#22c55e;">✅ Paquete Magic enviado con éxito a ${mac}. El dispositivo debería encenderse.</span>`;
    } catch (e) {
        document.getElementById("wol-status").textContent = "Error: " + e.message;
    } finally {
        btn.disabled = false; btn.textContent = "⚡ Encender Dispositivo";
    }
}

// ── iperf3 ───────────────────────────────────────────────────
async function runIperf3() {
    const target = document.getElementById("iperf3-target").value.trim();
    if (!target) return alert("Introduce la IP del servidor destino.");
    const btn = document.getElementById("iperf3-btn");
    btn.disabled = true; btn.textContent = "⏳ Midiendo...";
    document.getElementById("iperf3-status").textContent = "Ejecutando iperf3 contra " + target + " (espera unos segundos)...";
    document.getElementById("iperf3-result").style.display = "none";

    try {
        const res = await fetch("/api/tools/iperf3", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ target })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        document.getElementById("iperf3-status").textContent = "Test completado.";
        document.getElementById("iperf3-result").style.display = "";
        
        const parsed = data.result.parsed;
        document.getElementById("iperf3-raw").textContent = data.result.raw;
        
        if (parsed.end && parsed.end.sum_received) {
            const bps = parsed.end.sum_received.bits_per_second;
            const mbps = (bps / 1000000).toFixed(2);
            document.getElementById("iperf3-speed").textContent = mbps;
        } else {
            document.getElementById("iperf3-speed").textContent = "Error";
        }
    } catch (e) {
        document.getElementById("iperf3-status").textContent = "Error: " + e.message;
    } finally {
        btn.disabled = false; btn.textContent = "🚀 Iniciar Test";
    }
}

// ── OSINT ────────────────────────────────────────────────────
async function runOsint() {
    const target = document.getElementById("osint-target").value.trim();
    if (!target) return alert("Introduce un dominio o IP.");
    const btn = document.getElementById("osint-btn");
    btn.disabled = true; btn.textContent = "⏳ Consultando...";
    document.getElementById("osint-status").textContent = "Realizando consulta Whois para " + target + "...";
    document.getElementById("osint-raw").style.display = "none";

    try {
        const res = await fetch("/api/tools/osint", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ target })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        document.getElementById("osint-status").textContent = "Consulta completada.";
        document.getElementById("osint-raw").style.display = "";
        document.getElementById("osint-raw").textContent = data.result.raw;
    } catch (e) {
        document.getElementById("osint-status").textContent = "Error: " + e.message;
    } finally {
        btn.disabled = false; btn.textContent = "🔍 Consultar Info";
    }
}
"""

if "runWol" not in js:
    js += "\n" + new_js
    
    # Update loadToolsHistory mapping to include new tools:
    # const toolIcons = { nmap:"🔍", "arp-scan":"📡", metasploit:"🛡️" };
    old_icons = 'const toolIcons = { nmap:"🔍", "arp-scan":"📡", metasploit:"🛡️" };'
    new_icons = 'const toolIcons = { nmap:"🔍", "arp-scan":"📡", metasploit:"🛡️", iperf3:"🚀", osint:"🕵️" };'
    js = js.replace(old_icons, new_icons)
    
    # Update Nmap table rendering to add Open button for web ports
    old_nmap_row = """<td style="padding:6px 10px;">${p.port}</td>"""
    new_nmap_row = """<td style="padding:6px 10px;">
        ${p.port}
        ${(p.port === 80 || p.port === 443 || p.port === 8080 || p.port === 8443) ? `<a href="http${p.port===443||p.port===8443?'s':''}://${document.getElementById('nmap-target').value.split('/')[0]}:${p.port}" target="_blank" class="btn-sm" style="margin-left:8px; padding:2px 6px; font-size:0.7rem; background:rgba(59,130,246,0.3); text-decoration:none; color:white;">🌐 Abrir Web</a>` : ''}
    </td>"""
    
    js = js.replace(old_nmap_row, new_nmap_row)
    
    # Add service icons
    old_service_row = """<td style="padding:6px 10px;">${p.service}</td>"""
    new_service_row = """<td style="padding:6px 10px;">
        ${p.service.includes('ssh') ? '🔒 ' : p.service.includes('http') ? '🌐 ' : p.service.includes('ftp') ? '📁 ' : p.service.includes('mysql') || p.service.includes('postgre') ? '🗄️ ' : '🔌 '}
        ${p.service}
    </td>"""
    
    js = js.replace(old_service_row, new_service_row)

    with sftp.file("/home/tosito/nexus/frontend/app.js", "w") as f:
        f.write(js)
    print("Injected new JS logic for tools")
else:
    print("JS logic already present")

sftp.close()
c.close()