from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import asyncio
import os
from datetime import datetime

from scanner import NetworkScanner
from history import ScanHistory
from alerts import AlertSystem

app = FastAPI(title="Nexus Network API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scanner = NetworkScanner(subnet="192.168.1.0/24")
history = ScanHistory(db_path="/opt/nexus/data/history.json")
alerts = AlertSystem(db_path="/opt/nexus/data/known_devices.json")

FRONTEND_DIR = "/opt/nexus/web"
if os.path.isdir(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
async def root():
    index = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.isfile(index):
        return FileResponse(index)
    return {"message": "Nexus API running"}

@app.get("/api/scan")
async def quick_scan():
    try:
        devices = await asyncio.to_thread(scanner.quick_scan)
        entry = {"timestamp": datetime.utcnow().isoformat(), "type": "quick", "devices_found": len(devices), "devices": devices}
        history.save(entry)
        new_devices = alerts.check_new_devices(devices)
        return {"success": True, "scanned_at": entry["timestamp"], "devices_found": len(devices), "new_devices": len(new_devices), "devices": devices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scan/deep")
async def deep_scan(ip: str):
    try:
        result = await asyncio.to_thread(scanner.deep_scan, ip)
        return {"success": True, "ip": ip, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/network-info")
async def network_info():
    try:
        info = scanner.get_network_info()
        return {"success": True, "data": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(limit: int = 20):
    try:
        entries = history.get_all(limit=limit)
        return {"success": True, "count": len(entries), "history": entries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/alerts")
async def get_alerts():
    try:
        new_devices = alerts.get_new_devices()
        return {"success": True, "count": len(new_devices), "alerts": new_devices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/alerts")
async def clear_alerts():
    alerts.clear_new_devices()
    return {"success": True}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='0.0.0.0', port=3003, reload=False)
