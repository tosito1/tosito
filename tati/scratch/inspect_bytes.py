
import sys

target_file = r'c:\Users\Tosito\Desktop\Tosito\tati\index.html'

with open(target_file, 'rb') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if b'lbum' in line:
        print(f"Line {i}: {line}")
        print(f"Hex: {line.hex()}")
        break
