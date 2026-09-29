
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lobby_lines = lines[2392:2596] # Line 2393 to 2596
content = "".join(lobby_lines)

opens = len(re.findall(r'<div(?:\s|>|$)', content))
closes = len(re.findall(r'</div\s*>', content))
print(f"Lobby branch (2393-2596) - Opens: {opens}, Closes: {closes}")
