
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
    
    stack_b = []
    stack_p = []
    stack_s = [] # square brackets
    for i, line in enumerate(lines):
        cleaned = clean_code(line)
        for char in cleaned:
            if char == '{': stack_b.append(i + 1)
            elif char == '}': 
                if stack_b: stack_b.pop()
            elif char == '(': stack_p.append(i + 1)
            elif char == ')':
                if stack_p: stack_p.pop()
            elif char == '[': stack_s.append(i + 1)
            elif char == ']':
                if stack_s: stack_s.pop()
        
    print(f"Unclosed {{: {stack_b}")
    print(f"Unclosed (: {stack_p}")
    print(f"Unclosed [: {stack_s}")
else:
    print("No script tag found")
