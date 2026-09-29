
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    
    # Remove strings to avoid counting parens inside them
    script = re.sub(r'"(\\.|[^"\\])*"', '""', script)
    script = re.sub(r"'(\\.|[^'\\])*'", "''", script)
    script = re.sub(r'`(\\.|[^`\\])*`', '``', script)
    
    opens = script.count('(')
    closes = script.count(')')
    print(f"Total ( : {opens}")
    print(f"Total ) : {closes}")
    print(f"Diff: {opens - closes}")
else:
    print("No script tag found")
