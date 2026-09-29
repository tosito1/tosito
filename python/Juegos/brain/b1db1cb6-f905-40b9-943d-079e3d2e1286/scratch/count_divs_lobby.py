
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
opens = 0
closes = 0
for i in range(2341, 2538): # Range 2342 to 2538
    opens += lines[i].count('<div')
    closes += lines[i].count('</div')

print(f"Range 2342-2538: opens={opens}, closes={closes}")
print(f"Diff: {opens - closes}")
