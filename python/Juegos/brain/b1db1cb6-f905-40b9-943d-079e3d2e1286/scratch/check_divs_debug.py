
import re

def clean_code(code):
    # This is a bit risky but let's try to remove everything inside tags except the name
    # No, let's just do a simple search for <div and </div
    return code

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    lines = script.split('\n')
    
    stack = []
    for i, line in enumerate(lines):
        line_num = i + 155 # Start of script
        
        # Count <div
        opens = len(re.findall(r'<div(?:\s|>|$)', line))
        # Count </div>
        closes = len(re.findall(r'</div\s*>', line))
        
        for _ in range(opens):
            stack.append(line_num)
        
        for _ in range(closes):
            if stack:
                stack.pop()
            else:
                print(f"Excess closing div at line {line_num}")
    
    if stack:
        print(f"Unclosed divs from lines: {stack}")
else:
    print("No script tag found")
