
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the script tag containing the Babel code
start_tag = '<script type="text/babel">'
end_tag = '</script>'

start_idx = content.find(start_tag)
end_idx = content.find(end_tag, start_idx)

if start_idx != -1 and end_idx != -1:
    script_content = content[start_idx + len(start_tag):end_idx]
    
    # Simple brace counting
    open_braces = script_content.count('{')
    close_braces = script_content.count('}')
    open_parens = script_content.count('(')
    close_parens = script_content.count(')')
    
    print(f"Braces: Open: {open_braces}, Close: {close_braces}")
    print(f"Parens: Open: {open_parens}, Close: {close_parens}")
    
    # Try to find where the imbalance starts
    b_level = 0
    p_level = 0
    lines = script_content.split('\n')
    for i, line in enumerate(lines):
        # Remove comments
        cleaned = re.sub(r'//.*', '', line)
        # Remove strings (simple version)
        cleaned = re.sub(r'"[^"]*"', '""', cleaned)
        cleaned = re.sub(r"'[^']*'", "''", cleaned)
        # Template literals (only same line)
        cleaned = re.sub(r'`[^`]*`', '``', cleaned)
        
    print(f"Braces: {open_braces} vs {close_braces} -> Diff: {open_braces - close_braces}")
    print(f"Parens: {open_parens} vs {close_parens} -> Diff: {open_parens - close_parens}")
    
    # Try to find where the imbalance starts
    b_level = 0
    p_level = 0
    lines = script_content.split('\n')
    for i, line in enumerate(lines):
        cleaned = re.sub(r'//.*', '', line)
        cleaned = re.sub(r'"[^"]*"', '""', cleaned)
        cleaned = re.sub(r"'[^']*'", "''", cleaned)
        cleaned = re.sub(r'`[^`]*`', '``', cleaned)
        for char in cleaned:
            if char == '{': b_level += 1
            elif char == '}': b_level -= 1
            elif char == '(': p_level += 1
            elif char == ')': p_level -= 1
            
            if p_level < 0:
                print(f"Negative paren level at line {i+1} (char '{char}'): {line.strip()}")
                p_level = 0
        
        if b_level < 0:
            print(f"Negative brace level at line {i+1}: {line.strip()}")
            b_level = 0
    print(f"Final levels at end of script: Braces: {b_level}, Parens: {p_level}")
else:
    print("Script tag not found")
