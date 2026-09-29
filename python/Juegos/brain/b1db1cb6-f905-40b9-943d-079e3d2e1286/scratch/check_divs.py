
import re

def clean_tags(code):
    # Remove strings to avoid matching tags inside them
    code = re.sub(r'"(\\.|[^"\\])*"', '""', code)
    code = re.sub(r"'(\\.|[^'\\])*'", "''", code)
    code = re.sub(r'`(\\.|[^`\\])*`', '``', code)
    return code

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
div_stack = []
for i, line in enumerate(lines):
    cleaned = clean_tags(line)
    # Match <div... but not </div>
    opens = re.findall(r'<div(?!\w)', cleaned)
    closes = re.findall(r'</div>', cleaned)
    
    for _ in opens:
        div_stack.append(i + 1)
    for _ in closes:
        if div_stack:
            opened_at = div_stack.pop()
            print(f"div at line {i+1} closes div from line {opened_at}")
        else:
            print(f"Extra </div> at line {i+1}")

if div_stack:
    print(f"STILL OPEN DIVs: {div_stack}")
