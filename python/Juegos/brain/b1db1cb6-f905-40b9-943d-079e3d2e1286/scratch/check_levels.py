
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

b_level = 0
p_level = 0
in_script = False

for i, line in enumerate(lines):
    if '<script type="text/babel">' in line:
        in_script = True
        continue
    if '</script>' in line:
        in_script = False
        continue
    
    if not in_script:
        continue
        
    cleaned = re.sub(r'//.*', '', line)
    # Basic string removal (doesn't handle escaped quotes but should be enough)
    cleaned = re.sub(r'"[^"]*"', '""', cleaned)
    cleaned = re.sub(r"'[^']*'", "''", cleaned)
    cleaned = re.sub(r'`[^`]*`', '``', cleaned)
    
    for char in cleaned:
        if char == '{': b_level += 1
        elif char == '}': b_level -= 1
        elif char == '(': p_level += 1
        elif char == ')': p_level -= 1
    
    if i + 1 >= 2280:
        print(f"Line {i+1}: B={b_level}, P={p_level} | {line.strip()[:50]}")

print(f"Final levels: B={b_level}, P={p_level}")
