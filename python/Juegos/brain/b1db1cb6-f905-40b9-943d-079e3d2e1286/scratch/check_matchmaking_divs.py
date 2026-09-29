
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

match_lines = lines[2359:2391]

stack = []
for i, line in enumerate(match_lines):
    line_num = i + 2360
    
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
            print(f"Excess closing div in Matchmaking at line {line_num}")

if stack:
    print(f"Unclosed divs in Matchmaking from lines: {stack}")
else:
    print("Matchmaking divs balanced")
