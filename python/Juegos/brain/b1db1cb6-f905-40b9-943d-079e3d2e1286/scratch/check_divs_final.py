
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
    
    stack = []
    for i, line in enumerate(lines):
        line_num = i + 155 # Start of script
        cleaned = clean_code(line)
        
        opens = re.findall(r'<div(?:\s|>|$)', cleaned)
        closes = re.findall(r'</div\s*>', cleaned)
        
        for _ in opens:
            stack.append(line_num)
        
        for _ in closes:
            if stack:
                opened_at = stack.pop()
                # print(f"div at line {line_num} closes div from line {opened_at}")
            else:
                print(f"Error: </div> at line {line_num} has no opening <div>")

    if stack:
        print(f"Unclosed divs from lines: {stack}")
    else:
        print("All divs balanced within script")
else:
    print("No script tag found")
