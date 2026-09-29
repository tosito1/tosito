import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('public/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if 'networks-body' in l or 'Nombre (SSID)' in l or 'Criptograf' in l:
        print(i+1, l.rstrip()[:100])
