
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
    for i in range(script_tag_start + 1, len(lines)):
        line = lines[i]
        if '</script>' in line: break
        cleaned = re.sub(r'//.*', '', line)
        cleaned = re.sub(r'"[^"]*"', '', cleaned)
        cleaned = re.sub(r"'[^']*'", '', cleaned)
        cleaned = re.sub(r'`[^`]*`', '', cleaned)
        
        old_p = p_level
        for char in cleaned:
            if char == '(': p_level += 1
            elif char == ')': p_level -= 1
            
            if p_level != old_p:
                print(f"Char '{char}' at line {i+1}: P={p_level}")
                old_p = p_level
        
        if i + 1 > 100: break

    b_level = 0
    p_level = 0
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
        
        old_p = p_level
        for char in cleaned:
            if char == '(': p_level += 1
            elif char == ')': p_level -= 1
        
        if p_level != old_p and b_level == 0:
            print(f"P={p_level} at line {i+1}: {line.strip()[:40]}")
else:
    print("No script tag found")
