
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

o = content.count('(')
cl = content.count(')')
print(f"Total Parens: {o} vs {cl}")

# Find indices of all parens
indices = []
for i, char in enumerate(content):
    if char == '(':
        indices.append(('(', i))
    elif char == ')':
        indices.append((')', i))

# Try to find imbalance
stack = []
for p, idx in indices:
    if p == '(':
        stack.append(idx)
    else:
        if stack:
            stack.pop()
        else:
            print(f"Extra closing ) at index {idx}")

if stack:
    print(f"Unclosed ( at indices: {stack}")
    for idx in stack:
        # Print context
        start = max(0, idx - 20)
        end = min(len(content), idx + 20)
        print(f"Context: ...{content[start:end]}...")
