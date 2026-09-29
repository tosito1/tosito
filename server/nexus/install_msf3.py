import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

# Use the nightly installer script that handles sudo internally
# We wrap it in a shell script that provides the password
install_sh = """#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
# Download installer
curl -fsSL https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb -o /tmp/msfinstall
chmod +x /tmp/msfinstall
# Patch the script to not ask for sudo interactively - run as root directly
sed -i 's/sudo //g' /tmp/msfinstall 2>/dev/null || true
/tmp/msfinstall
"""

sftp = c.open_sftp()
with sftp.file("/tmp/do_install.sh", "w") as f:
    f.write(install_sh)
sftp.close()

_, stdout, stderr = c.exec_command(
    "echo '" + PASS + "' | sudo -S bash /tmp/do_install.sh 2>&1",
    timeout=600
)
out = stdout.read().decode("utf-8", errors="replace")
print(out[-2000:])  # last 2000 chars
print("=== MSF install done ===")

print("Checking msfconsole...")
_, stdout, _ = c.exec_command("which msfconsole 2>/dev/null || find /opt /usr -name msfconsole 2>/dev/null | head -3")
print(stdout.read().decode("utf-8", errors="replace").strip())

c.close()