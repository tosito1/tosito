
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<(/?div)[^>]*?>', re.DOTALL)

stack = []
for match in pattern.finditer(content):
    tag = match.group(1)
    line_num = content[:match.start()].count('\n') + 1
    if match.group(0).endswith('/>'): continue
    
    if tag == 'div':
        stack.append(line_num)
    else:
        if stack:
            open_line = stack.pop()
            if open_line >= 2344 or line_num >= 3440:
                print(f"L{open_line} -> L{line_num}")
        else:
            print(f"Extra </div> at line {line_num}")

print(f"Unclosed: {stack}")
