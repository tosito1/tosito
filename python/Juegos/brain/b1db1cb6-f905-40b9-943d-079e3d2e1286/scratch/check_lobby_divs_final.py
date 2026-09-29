
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lobby_lines = lines[2392:2596]

stack = []
for i, line in enumerate(lobby_lines):
    line_num = i + 2393
    
    # Identify self-closing div
    cleaned_line = re.sub(r'<div[^>]*/>', '', line)
    
    opens = re.findall(r'<div(?:\s|>|$)', cleaned_line)
    closes = re.findall(r'</div\s*>', cleaned_line)
    
    for _ in opens:
        stack.append(line_num)
    
    for _ in closes:
        if stack:
            stack.pop()
        else:
            print(f"Excess closing div in Lobby at line {line_num}")

if stack:
    print(f"Unclosed divs in Lobby from lines: {stack}")
else:
    print("Lobby divs balanced")
