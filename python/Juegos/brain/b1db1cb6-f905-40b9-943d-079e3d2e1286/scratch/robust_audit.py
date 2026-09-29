
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
    # Be careful with strings, some might contain > or <
    return_content = re.sub(r'"(\\.|[^"\\])*"', '""', return_content)
    return_content = re.sub(r"'(\\.|[^'\\])*'", "''", return_content)
    return_content = re.sub(r'`(\\.|[^`\\])*`', '``', return_content, flags=re.DOTALL)
    
    # Improved tag finding: find all <tag and </tag
    # Also handle self-closing <tag ... />
    
    tags = []
    # This regex finds <tagName ... > or <tagName ... /> or </tagName>
    # We want to capture tagName and whether it's closing or self-closing
    pattern = re.compile(r'<(/?[a-zA-Z0-9]+)([^>]*?)(/?)>')
    
    start_line = content[:start_idx].count('\n') + 1
    
    # We need to track line numbers for each match
    # Instead of splitting by lines, let's find matches in the whole string
    for match in pattern.finditer(return_content):
        full_match = match.group(0)
        tag_name = match.group(1)
        attrs = match.group(2)
        self_closing = match.group(3) == '/'
        
        line_num = start_line + return_content[:match.start()].count('\n')
        
        if tag_name.startswith('/'):
            tags.append(('close', tag_name[1:], line_num))
        elif self_closing or tag_name.lower() in ['img', 'br', 'hr', 'input']:
            tags.append(('self', tag_name, line_num))
        else:
            tags.append(('open', tag_name, line_num))

    stack = []
    for type, name, line in tags:
        if type == 'open':
            stack.append((name, line))
        elif type == 'close':
            if stack and stack[-1][0] == name:
                stack.pop()
            else:
                expected = stack[-1][0] if stack else "None"
                print(f"Mismatched tag at line {line}: found </{name}>, expected {expected}")
                # Try to recover? No, just print error
        
    print(f"Unclosed tags: {stack}")
else:
    print("Return statement not found")
