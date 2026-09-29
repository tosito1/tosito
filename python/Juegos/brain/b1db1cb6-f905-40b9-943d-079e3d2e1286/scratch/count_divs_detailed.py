
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    lines = script.split('\n')
    
    opens = []
    closes = []
    for i, line in enumerate(lines):
        line_num = i + 155 # Adjust to file line number (script starts at ~155)
        
        # Self-closing div
        cleaned_line = re.sub(r'<div[^>]*/>', '', line)
        
        for _ in re.findall(r'<div(?:\s|>|$)', cleaned_line):
            opens.append(line_num)
        
        for _ in re.findall(r'</div\s*>', cleaned_line):
            closes.append(line_num)
            
    print(f"Total opens: {len(opens)}")
    print(f"Total closes: {len(closes)}")
    
    if len(opens) > len(closes):
        print(f"More opens ({len(opens)}) than closes ({len(closes)})")
    elif len(closes) > len(opens):
        print(f"More closes ({len(closes)}) than opens ({len(opens)})")
    else:
        print("Balanced count")
        
    print(f"Last few opens: {opens[-5:]}")
    print(f"Last few closes: {closes[-5:]}")
else:
    print("No script tag found")
