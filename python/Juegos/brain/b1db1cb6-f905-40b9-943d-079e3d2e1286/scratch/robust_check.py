
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
    cleaned = clean_code(script)
    
    o = cleaned.count('(')
    cl = cleaned.count(')')
    print(f"Cleaned Script Parens: {o} vs {cl}")
    
    b_o = cleaned.count('{')
    b_cl = cleaned.count('}')
    print(f"Cleaned Script Braces: {b_o} vs {b_cl}")
    
    # Trace imbalance
    p = 0
    b = 0
    for i, char in enumerate(cleaned):
        if char == '(': p += 1
        elif char == ')': p -= 1
        elif char == '{': b += 1
        elif char == '}': b -= 1
        
        if p < 0:
            print(f"P negative at index {i}")
            p = 0
        if b < 0:
            print(f"B negative at index {i}")
            b = 0
            
    print(f"Final levels in cleaned script: P={p}, B={b}")
else:
    print("No script tag found")
