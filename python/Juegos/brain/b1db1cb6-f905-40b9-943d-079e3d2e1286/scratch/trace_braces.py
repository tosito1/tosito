
import re

def clean_code(code):
    # Remove strings (handling escaped quotes and template literals)
    code = re.sub(r'"(\\.|[^"\\])*"', '""', code)
    code = re.sub(r"'(\\.|[^'\\])*'", "''", code)
    code = re.sub(r'`(\\.|[^`\\])*`', '``', code)
    # Remove block comments
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    # Remove line comments
    code = re.sub(r'//.*', '', code)
    return code

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    lines = script.split('\n')
    print(f"Total lines: {len(lines)}")
    stack = []
    for i, line in enumerate(lines):
        cleaned = clean_code(line)
        for char in cleaned:
            if char == '{':
                stack.append(i + 1)
            elif char == '}':
                if stack:
                    opened_at = stack.pop()
                    if i + 1 > 2900 and i + 1 < 3360:
                        print(f"Brace at line {i+1} closes brace from line {opened_at}")
                else:
                    print(f"Extra }} at line {i+1}")
                    
    if stack:
        print(f"STILL OPEN: {stack}")
else:
    print("No script tag found")
