
import re

with open(r'c:\Users\Tosito\Desktop\Tosito\python\Ajedrez\public\palabritas_go.html', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Total <>: {content.count('<>')}")
print(f"Total </>: {content.count('</>')}")
