import psutil
import pyautogui
import os
import subprocess
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
from ctypes import cast, POINTER
from comtypes import CLSCTX_ALL
import cpuinfo

def get_system_stats():
    """Returns CPU, RAM, and Disk usage stats."""
    cpu_usage = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    info = cpuinfo.get_cpu_info()
    
    return {
        "cpu_percent": cpu_usage,
        "ram_percent": ram.percent,
        "ram_available_gb": round(ram.available / (1024**3), 2),
        "disk_percent": disk.percent,
        "cpu_brand": info.get('brand_raw', 'Unknown')
    }

def set_volume(level):
    """Sets the system volume (0 to 100)."""
    devices = AudioUtilities.GetSpeakers()
    interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    volume = cast(interface, POINTER(IAudioEndpointVolume))
    # Pycaw uses scalar 0.0 to 1.0
    volume.SetMasterVolumeLevelScalar(level / 100, None)
    return f"Volume set to {level}%"

def take_screenshot(filename="screenshot.png"):
    """Takes a screenshot and saves it."""
    screenshot = pyautogui.screenshot()
    screenshot.save(filename)
    return f"Screenshot saved as {filename}"

def list_processes():
    """Lists the top 5 CPU consuming processes."""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
        try:
            processes.append(proc.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    # Sort by CPU usage
    processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
    return processes[:5]

def run_app(path):
    """Launches an application."""
    if os.path.exists(path):
        os.startfile(path)
        return f"Launched {path}"
    else:
        # Try to run via command line
        try:
            subprocess.Popen(path, shell=True)
            return f"Attempted to launch {path}"
        except Exception as e:
            return f"Error launching {path}: {str(e)}"

if __name__ == "__main__":
    # Quick test
    print("System Stats:", get_system_stats())
    print("Top Processes:", list_processes())
