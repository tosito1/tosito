
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

content = lines[3031:3110] # From {showHints && ( to before )}

stack = []
for i, line in enumerate(content):
    line_num = i + 3032
    # Ignore self-closing
    line = re.sub(r'<[a-zA-Z0-9]+[^>]*/\s*>', '', line)
    tags = re.findall(r'<([a-zA-Z0-9]+)|</([a-zA-Z0-9]+)', line)
    for t in tags:
        if t[0]:
            if t[0].lower() not in ['img', 'br', 'hr', 'input']:
                stack.append((t[0], line_num))
        else:
            if stack and stack[-1][0] == t[1]:
                stack.pop()
            else:
                print(f"Mismatched tag at line {line_num}: expected {stack[-1][0] if stack else 'None'}, found {t[1]}")

print(f"Unclosed tags in showHints: {stack}")
