
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = 'return ('
start_idx = content.find(start_marker, content.find('function App'))
end_marker = ');'
end_idx = content.rfind(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    return_content = content[start_idx:end_idx+2]
    return_content = re.sub(r'\{/\*.*?\*/\}', '', return_content, flags=re.DOTALL)
    return_content = re.sub(r'"(\\.|[^"\\])*"', '""', return_content)
    return_content = re.sub(r"'(\\.|[^'\\])*'", "''", return_content)
    return_content = re.sub(r'`(\\.|[^`\\])*`', '``', return_content, flags=re.DOTALL)
    return_content = re.sub(r'<style[^>]*dangerouslySetInnerHTML=[^>]*/>', '', return_content)
    
    pattern = re.compile(r'<(/?[a-zA-Z0-9]+)([^>]*?)(/?)>')
    start_line = content[:start_idx].count('\n') + 1
    
    stack = []
    for match in pattern.finditer(return_content):
        tag_name = match.group(1)
        self_closing = match.group(3) == '/'
        line_num = start_line + return_content[:match.start()].count('\n')
        
        if tag_name.startswith('/'):
            name = tag_name[1:]
            if stack and stack[-1][0] == name:
                open_tag, open_line = stack.pop()
                if open_line >= 2340: # Only care about the App return part
                    print(f"Closed <{open_tag}> from line {open_line} at line {line_num}")
            else:
                print(f"Mismatched tag at line {line_num}: found </{tag_name[1:]}>")
        elif self_closing or tag_name.lower() in ['img', 'br', 'hr', 'input']:
            pass
        else:
            stack.append((tag_name, line_num))

    print(f"Unclosed tags: {stack}")
else:
    print("Return statement not found")
