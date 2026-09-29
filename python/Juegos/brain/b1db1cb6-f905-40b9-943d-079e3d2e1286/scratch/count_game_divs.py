
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

game_lines = lines[2598:3448] # Line 2599 to 3448 (0-indexed lines[2598] is line 2599)
content = "".join(game_lines)

opens = len(re.findall(r'<div(?:\s|>|$)', content))
closes = len(re.findall(r'</div\s*>', content))
print(f"Game branch (2599-3448) - Opens: {opens}, Closes: {closes}")
