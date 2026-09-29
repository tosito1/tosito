
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    self_closing = re.findall(r'<div[^>]*/>', script)
    print(f"Self-closing divs: {len(self_closing)}")
    for d in self_closing:
        print(f"Found: {d[:50]}...")
else:
    print("No script tag found")
