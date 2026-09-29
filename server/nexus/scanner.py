import nmap
import subprocess
import socket
import json
import re
import psutil
import netifaces
from typing import List, Dict, Optional

# MAC vendor lookup (offline, common vendors)
MAC_VENDORS = {
    "b8:27:eb": "Raspberry Pi", "dc:a6:32": "Raspberry Pi", "e4:5f:01": "Raspberry Pi",
    "00:50:f2": "Microsoft", "00:1a:7d": "Apple", "f8:1e:df": "Apple",
    "18:65:90": "Apple", "ac:de:48": "Apple", "a4:c3:f0": "Google",
    "30:fd:38": "Samsung", "3c:bd:3e": "Samsung", "00:0c:e7": "Intel",
    "8c:85:90": "Intel", "a4:c3:f0": "Google",
}

def get_vendor(mac: str) -> str:
    if not mac:
        return "Desconocido"
    prefix = mac.lower()[:8].replace(":", ":")
    for k, v in MAC_VENDORS.items():
        if prefix.startswith(k):
            return v
    return "Desconocido"

class NetworkScanner:
    def __init__(self, subnet: str = "192.168.1.0/24"):
        self.subnet = subnet
        self.nm = nmap.PortScanner()

    def quick_scan(self) -> List[Dict]:
        """Ping scan: hosts activos con MAC e IP."""
        self.nm.scan(hosts=self.subnet, arguments="-sn --send-ip")
        devices = []
        for host in self.nm.all_hosts():
            info = self.nm[host]
            mac = ""
            vendor = ""
            if "addresses" in info:
                mac = info["addresses"].get("mac", "")
                vendor = info.get("vendor", {}).get(mac, "") or get_vendor(mac)
            hostname = info.hostname() or self._resolve_hostname(host)
            status = info.state() if hasattr(info, "state") else "up"
            devices.append({
                "ip": host,
                "hostname": hostname,
                "mac": mac,
                "vendor": vendor,
                "status": "online",
            })
        return devices

    def deep_scan(self, ip: str) -> Dict:
        """Escaneo de puertos + deteccion SO de un host especifico."""
        self.nm.scan(hosts=ip, arguments="-sV -O -T4 --top-ports 100")
        if ip not in self.nm.all_hosts():
            return {"error": "Host no encontrado o no responde"}
        info = self.nm[ip]
        ports = []
        for proto in info.all_protocols():
            for port in info[proto].keys():
                p = info[proto][port]
                ports.append({
                    "port": port,
                    "protocol": proto,
                    "state": p.get("state", ""),
                    "service": p.get("name", ""),
                    "version": p.get("version", ""),
                    "product": p.get("product", ""),
                })
        os_matches = []
        if "osmatch" in info:
            for match in info["osmatch"][:3]:
                os_matches.append({
                    "name": match.get("name", ""),
                    "accuracy": match.get("accuracy", ""),
                })
        return {
            "ip": ip,
            "hostname": info.hostname(),
            "mac": info["addresses"].get("mac", "") if "addresses" in info else "",
            "ports": sorted(ports, key=lambda x: x["port"]),
            "os_matches": os_matches,
            "os_detected": os_matches[0]["name"] if os_matches else "Desconocido",
        }

    def get_network_info(self) -> Dict:
        """Gateway, IP local, DNS, subred."""
        try:
            gateways = netifaces.gateways()
            default_gw = gateways.get("default", {}).get(netifaces.AF_INET, [None])[0]
            iface = gateways.get("default", {}).get(netifaces.AF_INET, [None, None])[1]
            local_ip = ""
            netmask = ""
            if iface:
                addrs = netifaces.ifaddresses(iface)
                if netifaces.AF_INET in addrs:
                    local_ip = addrs[netifaces.AF_INET][0].get("addr", "")
                    netmask = addrs[netifaces.AF_INET][0].get("netmask", "")
            # DNS
            dns_servers = []
            try:
                with open("/etc/resolv.conf") as f:
                    for line in f:
                        if line.startswith("nameserver"):
                            dns_servers.append(line.split()[1])
            except Exception:
                pass
            # Latencia al gateway
            latency = self._ping_latency(default_gw) if default_gw else None
            return {
                "local_ip": local_ip,
                "gateway": default_gw,
                "subnet": self.subnet,
                "netmask": netmask,
                "interface": iface,
                "dns_servers": dns_servers,
                "gateway_latency_ms": latency,
            }
        except Exception as e:
            return {"error": str(e)}

    def _resolve_hostname(self, ip: str) -> str:
        try:
            return socket.gethostbyaddr(ip)[0]
        except Exception:
            return ""

    def _ping_latency(self, ip: str) -> Optional[float]:
        try:
            result = subprocess.run(
                ["ping", "-c", "1", "-W", "1", ip],
                capture_output=True, text=True, timeout=3
            )
            match = re.search(r"time=(\d+\.?\d*)\s*ms", result.stdout)
            return float(match.group(1)) if match else None
        except Exception:
            return None
