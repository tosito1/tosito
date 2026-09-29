import json
import os
from datetime import datetime
from typing import List, Dict

class AlertSystem:
    def __init__(self, db_path: str = "/opt/nexus/data/known_devices.json"):
        self.db_path = db_path
        self.new_db_path = db_path.replace("known_devices.json", "new_devices.json")
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        if not os.path.exists(db_path):
            self._write_known({})
        if not os.path.exists(self.new_db_path):
            self._write_new([])

    def _read_known(self) -> Dict:
        try:
            with open(self.db_path, "r") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_known(self, data: Dict):
        with open(self.db_path, "w") as f:
            json.dump(data, f, indent=2)

    def _read_new(self) -> List[Dict]:
        try:
            with open(self.new_db_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_new(self, data: List[Dict]):
        with open(self.new_db_path, "w") as f:
            json.dump(data, f, indent=2)

    def check_new_devices(self, devices: List[Dict]) -> List[Dict]:
        known = self._read_known()
        new_devices = self._read_new()
        new_found = []
        now = datetime.utcnow().isoformat()

        for device in devices:
            key = device.get("mac") or device.get("ip")
            if not key:
                continue
            if key not in known:
                known[key] = {"first_seen": now, "ip": device.get("ip"), "hostname": device.get("hostname"), "vendor": device.get("vendor")}
                alert = {**device, "first_seen": now, "seen": False}
                new_devices.append(alert)
                new_found.append(alert)
            else:
                # Update last seen IP
                known[key]["last_ip"] = device.get("ip")

        self._write_known(known)
        self._write_new(new_devices)
        return new_found

    def get_new_devices(self) -> List[Dict]:
        return [d for d in self._read_new() if not d.get("seen", False)]

    def clear_new_devices(self):
        data = self._read_new()
        for d in data:
            d["seen"] = True
        self._write_new(data)
