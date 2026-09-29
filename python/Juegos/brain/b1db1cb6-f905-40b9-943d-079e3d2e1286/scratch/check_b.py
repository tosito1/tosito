
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
        b += cleaned.count('{') - cleaned.count('}')
        p += cleaned.count('(') - cleaned.count(')')
        if i + 1 > len(lines) - 20:
            print(f"Line {i+1}: B={b}, P={p} | {line.strip()[:40]}")
else:
    print("No script tag found")
