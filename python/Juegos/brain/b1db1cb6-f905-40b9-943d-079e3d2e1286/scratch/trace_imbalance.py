
import re

def clean_code(code):
    # Remove strings (handling escaped quotes)
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
    
    stack = []
    for i, line in enumerate(lines):
        cleaned = clean_code(line)
        for char in cleaned:
            if char == '{':
                stack.append(i + 1)
            elif char == '}':
                if stack:
                    stack.pop()
                else:
                    print(f"Extra }} at line {i+1}")
        
    if stack:
        print(f"Unclosed {{ from lines: {stack}")
    else:
        print("All braces balanced")
        
    stack_p = []
    for i, line in enumerate(lines):
        cleaned = clean_code(line)
        for char in cleaned:
            if char == '(':
                stack_p.append(i + 1)
            elif char == ')':
                if stack_p:
                    stack_p.pop()
                else:
                    print(f"Extra ) at line {i+1}")
    if stack_p:
        print(f"Unclosed ( from lines: {stack_p}")
    else:
        print("All parens balanced")
else:
    print("No script tag found")
