
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all <div or </div (even across lines)
# We need to know the line number for each.
stack = []
pattern = re.compile(r'<(/?div)[^>]*?>', re.DOTALL)

for match in pattern.finditer(content):
    tag = match.group(1)
    # Get line number
    line_num = content[:match.start()].count('\n') + 1
    
    # Ignore self-closing
    if match.group(0).endswith('/>'):
        continue
        
    if tag == 'div':
        stack.append(line_num)
    elif tag == '/div':
        if stack:
            # print(f"Closed div from line {stack[-1]} at line {line_num}")
            stack.pop()
        else:
            print(f"Extra </div> at line {line_num}")

print(f"Unclosed divs starting at lines: {stack}")
