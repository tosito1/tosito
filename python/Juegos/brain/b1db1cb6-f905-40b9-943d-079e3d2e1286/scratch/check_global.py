
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

script_tag_start = -1
for i, line in enumerate(lines):
    if '<script type="text/babel">' in line:
        script_tag_start = i
        break

if script_tag_start != -1:
    p_level = 0
    b_level = 0
    for i in range(script_tag_start + 1, len(lines)):
        line = lines[i]
        if '</script>' in line: break
        
        cleaned = re.sub(r'//.*', '', line)
        cleaned = re.sub(r'"[^"]*"', '', cleaned)
        cleaned = re.sub(r"'[^']*'", '', cleaned)
        cleaned = re.sub(r'`[^`]*`', '', cleaned)
        
        for char in cleaned:
            if char == '(': p_level += 1
            elif char == ')': p_level -= 1
            elif char == '{': b_level += 1
            elif char == '}': b_level -= 1
            
        if p_level != 0 and b_level == 0:
             print(f"Line {i+1}: P={p_level} | {line.strip()[:50]}")
             # break
             
    print(f"Final levels: P={p_level}, B={b_level}")
else:
    print("No script tag found")
