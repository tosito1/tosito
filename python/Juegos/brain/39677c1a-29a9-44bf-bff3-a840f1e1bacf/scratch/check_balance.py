def check_balance(filename, start_line, end_line):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    content = "".join(lines[start_line-1:end_line])
    
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    
    for i, char in enumerate(content):
        if char in '({[':
            stack.append((char, i))
        elif char in ')}]':
            if not stack:
                print(f"Extra closing char '{char}' at index {i}")
            else:
                top, pos = stack.pop()
                if top != pairs[char]:
                    print(f"Mismatched char '{char}' at index {i}, expected match for '{top}' from index {pos}")
    
    if stack:
        for char, pos in stack:
            print(f"Unclosed char '{char}' from index {pos}")

check_balance('c:/Users/Tosito/Desktop/Tosito/python/Ajedrez/public/plata_o_plomo.html', 1723, 2447)
