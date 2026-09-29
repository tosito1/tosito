
import re

def clean_code(code):
    code = re.sub(r'"(\\.|[^"\\])*"', '""', code)
    code = re.sub(r"'(\\.|[^'\\])*'", "''", code)
    code = re.sub(r'`(\\.|[^`\\])*`', '``', code)
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    code = re.sub(r'//.*', '', code)
    return code

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    lines = script.split('\n')
    print(f"Total lines: {len(lines)}")
    b = 0
    p = 0
    for i, line in enumerate(lines):
        cleaned = clean_code(line)
        old_b = b
        b += cleaned.count('{') - cleaned.count('}')
        p += cleaned.count('(') - cleaned.count(')')
        
        if b != old_b and p == 0: # Check global scope
             # print(f"B={b} at line {i+1}: {line.strip()[:40]}")
             pass
             
    # Let's find the FIRST line where B increases and never returns to 0 before App ends
    b = 0
    for i, line in enumerate(lines):
        cleaned = clean_code(line)
        b += cleaned.count('{') - cleaned.count('}')
        if b > 1 and i + 1 > 2285: # Inside App and return
             # We expect B to increase and decrease for expressions
             pass
    
    # Actually, let's just find the first line where B increases and doesn't decrease for a long time
    b = 0
    for i, line in enumerate(lines):
        cleaned = clean_code(line)
        old_b = b
        b += cleaned.count('{') - cleaned.count('}')
        if i + 1 >= 282 and i + 1 <= 350:
            print(f"Line {i+1}: B={b} | {line.strip()[:40]}")
else:
    print("No script tag found")
