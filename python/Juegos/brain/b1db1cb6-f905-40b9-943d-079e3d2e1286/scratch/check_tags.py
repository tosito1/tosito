
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

script_match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if script_match:
    script = script_match.group(1)
    
    # Simple tag balancer for <div>
    # (Note: This is very basic and won't handle components or other tags well, 
    # but let's see if <div> is balanced inside the script)
    
    # Remove strings and comments first
    def clean_code(code):
        code = re.sub(r'"(\\.|[^"\\])*"', '""', code)
        code = re.sub(r"'(\\.|[^'\\])*'", "''", code)
        code = re.sub(r'`(\\.|[^`\\])*`', '``', code)
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        code = re.sub(r'//.*', '', code)
        return code
        
    cleaned = clean_code(script)
    
    stack = []
    # Find all <div and </div
    tags = re.finditer(r'<(div)\b|(/div)>', cleaned)
    for match in tags:
        line_no = script[:match.start()].count('\n') + 1
        if line_no in [1563, 1601]:
            line_content = script.split('\n')[line_no-1]
            print(f"Match at line {line_no}: {line_content.strip()}")
            # print(f"Cleaned: {clean_code(line_content)}")
        
        if match.group(1): # open
            if stack:
                stack.pop()
            else:
                line_no = script[:match.start()].count('\n') + 1
                print(f"Extra </div> found at line {line_no}")
                
    if stack:
        print(f"Unclosed div tags from lines: {stack}")
    else:
        print("Div tags balanced")
else:
    print("No script tag found")
