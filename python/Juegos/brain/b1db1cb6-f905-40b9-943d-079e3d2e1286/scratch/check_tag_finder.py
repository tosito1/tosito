
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = 'return ('
start_idx = content.find(start_marker, content.find('function App'))
end_marker = ');'
end_idx = content.rfind(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    return_content = content[start_idx:end_idx+2]
    # return_content = re.sub(r'\{/\*.*?\*/\}', '', return_content, flags=re.DOTALL)
    
    pattern = re.compile(r'<(/?[a-zA-Z0-9]+)([^>]*?)(/?)>')
    start_line = content[:start_idx].count('\n') + 1
    
    for match in pattern.finditer(return_content):
        tag_name = match.group(1)
        line_num = start_line + return_content[:match.start()].count('\n')
        if line_num == 3033:
            print(f"Found tag at 3033: {tag_name}")
        if line_num >= 3105 and line_num <= 3110:
             print(f"Found tag at {line_num}: {tag_name}")
else:
    print("Return statement not found")
