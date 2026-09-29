import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd, sudo=False, timeout=600):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out[:800])
    if err:
        f = [l for l in err.splitlines() if "password" not in l.lower() and "contrase" not in l.lower() and "authenticate" not in l.lower()]
        if f: print("[err]", "\n".join(f[:5]))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

print("[1] Downloading Metasploit installer...")
run(c, "curl -fsSL https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb -o /tmp/msfinstall 2>&1", timeout=60)

print("[2] Installing Metasploit Framework (this takes ~5 minutes)...")
run(c, "chmod 755 /tmp/msfinstall && /tmp/msfinstall 2>&1 | tail -20", sudo=True, timeout=600)

print("[3] Verify msfconsole...")
print(run(c, "which msfconsole 2>/dev/null || msfconsole --version 2>/dev/null | head -2 || echo NOT_FOUND"))

print("[4] Initialize MSF database (takes ~2 min)...")
run(c, "msfdb init 2>&1 | tail -5", sudo=True, timeout=180)

print("MSF INSTALL DONE")
c.close()