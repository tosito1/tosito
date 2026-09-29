
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the return statement
start_marker = 'return ('
start_idx = content.find(start_marker, content.find('function App'))
end_marker = ');'
end_idx = content.rfind(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    return_content = content[start_idx:end_idx+2]
    
    # Remove strings and comments
    return_content = re.sub(r'\{/\*.*?\*/\}', '', return_content, flags=re.DOTALL)
    return_content = re.sub(r'"(\\.|[^"\\])*"', '""', return_content)
    return_content = re.sub(r'`(\\.|[^`\\])*`', '``', return_content)
    
    # Split into lines
    lines = return_content.split('\n')
    tag_stack = []
    curly_stack = []
    paren_stack = []
    
    start_line = content[:start_idx].count('\n') + 1
    
    for i, line in enumerate(lines):
        line_num = i + start_line
        
        # Simple char loop to handle nested curlies/parens
        for char in line:
            if char == '{': curly_stack.append(line_num)
            elif char == '}':
                if curly_stack: curly_stack.pop()
                else: print(f"Excess }} at line {line_num}")
            elif char == '(': paren_stack.append(line_num)
            elif char == ')':
                if paren_stack: paren_stack.pop()
                else: print(f"Excess ) at line {line_num}")
        
        # Simple tag regex (not perfect but good enough for balancing)
        # Ignore self-closing
        line = re.sub(r'<[a-zA-Z0-9]+[^>]*/\s*>', '', line)
        tags = re.findall(r'<([a-zA-Z0-9]+)|</([a-zA-Z0-9]+)', line)
        for t in tags:
            if t[0]: # Open
                if t[0].lower() not in ['img', 'br', 'hr', 'input']:
                    tag_stack.append((t[0], line_num))
            else: # Close
                if tag_stack and tag_stack[-1][0] == t[1]:
                    tag_stack.pop()
                else:
                    print(f"Mismatched tag at line {line_num}: expected {tag_stack[-1][0] if tag_stack else 'None'}, found {t[1]}")
    
    print(f"Unclosed tags: {tag_stack}")
    print(f"Unclosed curlies: {curly_stack}")
    print(f"Unclosed parens: {paren_stack}")
else:
    print("Return statement not found")
