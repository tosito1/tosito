
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    lines = script.split('\n')
    
    opens = []
    closes = []
    stack = []
    for i, line in enumerate(lines):
        line_num = i + 101 # script content starts at line 101
        
        # Self-closing div
        cleaned_line = re.sub(r'<div[^>]*/>', '', line)
        
        for _ in re.findall(r'<div(?:\s|>|$)', cleaned_line):
            opens.append(line_num)
            stack.append(line_num)
        
        for _ in re.findall(r'</div\s*>', cleaned_line):
            closes.append(line_num)
            if stack:
                stack.pop()
            else:
                print(f"Excess closing div at line {line_num}")
            
    print(f"Total opens: {len(opens)}")
    print(f"Total closes: {len(closes)}")
    
    if stack:
        print(f"Unclosed divs from lines: {stack}")
    else:
        print("All divs balanced")
        
    print(f"Last few opens: {opens[-5:]}")
    print(f"Last few closes: {closes[-5:]}")
else:
    print("No script tag found")
