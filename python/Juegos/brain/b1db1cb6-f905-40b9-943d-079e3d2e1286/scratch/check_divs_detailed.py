
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
div_stack = []
for i, line in enumerate(lines):
    # Match <div... and </div>
    tokens = re.findall(r'<div|</div', line)
    for token in tokens:
        if token == '<div':
            div_stack.append(i + 1)
        else:
            if div_stack:
                opened_at = div_stack.pop()
                if i + 1 > 2530 and i + 1 < 2550:
                    print(f"div at line {i+1} closes div from line {opened_at}")
            else:
                print(f"Extra </div> at line {i+1}")
