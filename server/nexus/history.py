import json
import os
from datetime import datetime
from typing import List, Dict

class ScanHistory:
    def __init__(self, db_path: str = "/opt/nexus/data/history.json"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        if not os.path.exists(db_path):
            self._write([])

    def _read(self) -> List[Dict]:
        try:
            with open(self.db_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _write(self, data: List[Dict]):
        with open(self.db_path, "w") as f:
            json.dump(data, f, indent=2, default=str)

    def save(self, entry: Dict):
        data = self._read()
        # Keep only last 100 entries
        data.insert(0, entry)
        if len(data) > 100:
            data = data[:100]
        self._write(data)

    def get_all(self, limit: int = 20) -> List[Dict]:
        data = self._read()
        # Return summary only (no full device list to keep it light)
        summaries = []
        for entry in data[:limit]:
            summaries.append({
                "timestamp": entry.get("timestamp"),
                "type": entry.get("type", "quick"),
                "devices_found": entry.get("devices_found", 0),
            })
        return summaries
