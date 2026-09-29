
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    
    # Strip comments first to avoid false positives
    script = re.sub(r'//.*', '', script)
    script = re.sub(r'/\*.*?\*/', '', script, flags=re.DOTALL)
    
    # Simple counting
    counts = {
        '{': script.count('{'),
        '}': script.count('}'),
        '(': script.count('('),
        ')': script.count(')'),
        '[': script.count('['),
        ']': script.count(']')
    }
    
    print(f"Counts: {counts}")
    
    # Track nesting
    stack = []
    lines = script.split('\n')
    for i, line in enumerate(lines):
        # Ignore strings roughly
        line = re.sub(r'"[^"]*"', '', line)
        line = re.sub(r"'[^']*'", '', line)
        line = re.sub(r'`[^`]*`', '', line)
        
        for char in line:
            if char in '{([':
                stack.append((char, i+1))
            elif char in '})]':
                if not stack:
                    print(f"Extra closing {char} at line {i+1}")
                    continue
                top, line_num = stack.pop()
                if (top == '{' and char != '}') or \
                   (top == '(' and char != ')') or \
                   (top == '[' and char != ']'):
                    print(f"Mismatched {char} at line {i+1} (matches {top} from line {line_num})")
    
    if stack:
        print(f"Unclosed items in stack: {stack}")
else:
    print("No script tag found")
