
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'\)}\s*</div>\s*</div\s*>'
for m in re.finditer(pattern, content):
    line_num = content.count('\n', 0, m.start()) + 1
    print(f"Match at line {line_num}")
