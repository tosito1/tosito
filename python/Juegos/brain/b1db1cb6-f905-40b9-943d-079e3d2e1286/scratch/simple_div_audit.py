
import sys

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    line_num = i + 1
    # Find all <div or </div
    # (Simplified for now)
    import re
    # Match <div (open) or </div (close)
    # Ignore self-closing <div ... />
    matches = re.finditer(r'<(/?div)[^>]*>', line)
    for m in matches:
        tag = m.group(1)
        # Check for self-closing / at the end of the match
        if m.group(0).endswith('/>'):
            continue
            
        if tag == 'div':
            stack.append(line_num)
        elif tag == '/div':
            if stack:
                stack.pop()
            else:
                print(f"Extra </div> at line {line_num}")

print(f"Unclosed divs starting at lines: {stack}")
