
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

game_lines = lines[2598:3446]

stack = []
for i, line in enumerate(game_lines):
    line_num = i + 2599
    
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
            print(f"Excess closing div in Game at line {line_num}")

if stack:
    print(f"Unclosed divs in Game from lines: {stack}")
else:
    print("Game divs balanced")
