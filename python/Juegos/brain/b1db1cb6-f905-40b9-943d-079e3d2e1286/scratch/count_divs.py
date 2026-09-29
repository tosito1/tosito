
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Only analyze the script part
script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    lines = script.split('\n')
    
    # Simple count
    total_opens = 0
    total_closes = 0
    for line in lines:
        total_opens += line.count('<div')
        total_closes += line.count('</div>')
    
    print(f"Total <div: {total_opens}")
    print(f"Total </div: {total_closes}")
    print(f"Diff: {total_opens - total_closes}")
else:
    print("No script tag found")
