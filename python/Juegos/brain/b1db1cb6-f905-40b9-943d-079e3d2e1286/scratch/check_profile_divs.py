
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

range_lines = lines[3240:3390]

stack = []
for i, line in enumerate(range_lines):
    line_num = i + 3241
    
    opens = re.findall(r'<div(?:\s|>|$)', line)
    closes = re.findall(r'</div\s*>', line)
    
    for _ in opens:
        stack.append(line_num)
    
    for _ in closes:
        if stack:
            stack.pop()
        else:
            print(f"Excess closing div in range at line {line_num}")

if stack:
    print(f"Unclosed divs in range from lines: {stack}")
else:
    print("Range divs balanced")
