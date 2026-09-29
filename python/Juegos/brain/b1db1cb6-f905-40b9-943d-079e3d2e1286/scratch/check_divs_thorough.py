
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    lines = script.split('\n')
    
    stack = []
    for i, line in enumerate(lines):
        line_num = i + 155
        
        # Match <div or <div followed by space or >
        opens = re.findall(r'<div(?:\s|>|$)', line)
        # Match </div>
        closes = re.findall(r'</div\s*>', line)
        
        for _ in opens:
            stack.append(line_num)
        
        for _ in closes:
            if stack:
                stack.pop()
            else:
                print(f"Excess closing div at line {line_num}")
    
    if stack:
        print(f"Unclosed divs from lines: {stack}")
    else:
        print("All divs balanced")
else:
    print("No script tag found")
