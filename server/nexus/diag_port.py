import paramiko, time

HOST = "192.168.1.134"
USER = "tosito"
PASS = "tosito13"

def run(c, cmd, sudo=False):
    full = ("echo '" + PASS + "' | sudo -S " + cmd) if sudo else cmd
    _, stdout, stderr = c.exec_command(full, timeout=20)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out[:600])
    return out

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS)

print("[1] Process details for PID on port 3000:")
pid = run(c, "lsof -i :3000 -t 2>/dev/null | head -1", sudo=True)
print("PID:", pid)
if pid:
    print(run(c, "ps -p " + pid + " -o pid,ppid,user,cmd --no-headers 2>/dev/null", sudo=True))
    print(run(c, "cat /proc/" + pid + "/cmdline 2>/dev/null | tr '\\0' ' '", sudo=True))

print("[2] All services that could start something on 3000:")
print(run(c, "systemctl list-units --type=service --state=running | grep -i 'nexus\\|node\\|network'", sudo=True))

print("[3] Any other nexus service/timer:")
print(run(c, "systemctl list-units 'nexus*' --all"))
print(run(c, "ls /etc/systemd/system/ | grep nexus"))

print("[4] Try stopping all nexus things and killing port:")
run(c, "systemctl stop nexus-node nexus-api 2>/dev/null || true", sudo=True)
time.sleep(1)
run(c, "fuser -k 3000/tcp 2>/dev/null || true", sudo=True)
time.sleep(2)
print("Port 3000 now:", run(c, "ss -tlnp | grep 3000 || echo FREE"))

c.close()