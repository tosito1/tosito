
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
    
    stack_p = []
    for i, line in enumerate(lines):
        cleaned = clean_code(line)
        for char in cleaned:
            if char == '(':
                stack_p.append(i + 1)
            elif char == ')':
                if stack_p:
                    opened_at = stack_p.pop()
                    if i + 1 > 2450 and i + 1 < 2550:
                        print(f"Paren at script line {i+1} closes paren from script line {opened_at}")
                else:
                    if i + 1 > 2450 and i + 1 < 2550:
                        print(f"Extra ) at script line {i+1}")
else:
    print("No script tag found")
