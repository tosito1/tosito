
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL).group(1)

p = 0
b = 0
lines = script.split('\n')
for i, line in enumerate(lines):
    cleaned = re.sub(r'//.*', '', line)
    cleaned = re.sub(r'"[^"]*"', '', cleaned)
    cleaned = re.sub(r"'[^']*'", '', cleaned)
    cleaned = re.sub(r'`[^`]*`', '', cleaned)
    
    for c in cleaned:
        if c == '(': p += 1
        elif c == ')': p -= 1
        elif c == '{': b += 1
        elif c == '}': b -= 1
    
    if p != 0 and b == 0:
        # Check if we are in global scope and p is not 0
        # (This might happen for multi-line expressions)
        pass
        
print(f"Final levels: P={p}, B={b}")

# Find where p level becomes 1 at end of file
p = 0
b = 0
for i, line in enumerate(lines):
    cleaned = re.sub(r'//.*', '', line)
    cleaned = re.sub(r'"[^"]*"', '', cleaned)
    cleaned = re.sub(r"'[^']*'", '', cleaned)
    cleaned = re.sub(r'`[^`]*`', '', cleaned)
    for c in cleaned:
        if c == '(': p += 1
        elif c == ')': p -= 1
        elif c == '{': b += 1
        elif c == '}': b -= 1
    if i + 1 > 3380:
        print(f"Line {i+1}: P={p}, B={b} | {line.strip()[:40]}")
