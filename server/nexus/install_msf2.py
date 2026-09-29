import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd, sudo=False, timeout=600):
    full = ("echo '" + PASS + "' | sudo -S bash -c " + repr(cmd)) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=timeout, get_pty=False)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out[:600])
    if err:
        f = [l for l in err.splitlines() if "password" not in l.lower() and "contrase" not in l.lower() and "authenticate" not in l.lower()]
        if f: print("[err]", "\n".join(f[:5]))
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

print("[1] Install via apt (metasploit-framework package)...")
# Add Rapid7 apt repo
run(c, "curl -fsSL https://apt.metasploit.com/metasploit-framework.gpg -o /etc/apt/trusted.gpg.d/metasploit.gpg 2>&1", sudo=True, timeout=30)
run(c, "echo 'deb https://apt.metasploit.com/ focal main' > /etc/apt/sources.list.d/metasploit.list", sudo=True)
run(c, "apt-get update -qq 2>&1 | tail -3", sudo=True, timeout=120)
print("[2] Installing metasploit-framework...")
run(c, "DEBIAN_FRONTEND=noninteractive apt-get install -y metasploit-framework 2>&1 | tail -8", sudo=True, timeout=600)
print("[3] Check msfconsole...")
print(run(c, "which msfconsole || echo NOT_FOUND"))
print("[4] Init db...")
run(c, "msfdb init 2>&1 | tail -5", sudo=True, timeout=180)
print("DONE")
c.close()