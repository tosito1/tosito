
import sys
import os

target_file = r'c:\Users\Tosito\Desktop\Tosito\tati\index.html'

def fix_html():
    with open(target_file, 'rb') as f:
        content = f.read()
    
    # 1. Fix UTF-8 encoding issues (replacing common corrupted sequences)
    # Album -> Ã lbum -> \xc3\x83\x20lbum
    # Coraz\xc3\xb3n -> Coraz\xc3\x83\xc2\xb3n
    
    replacements = [
        (b'\xc3\x83\xc2\x81', 'Á'.encode('utf-8')),
        (b'\xc3\x83\xc2\x89', 'É'.encode('utf-8')),
        (b'\xc3\x83\xc2\x8d', 'Í'.encode('utf-8')),
        (b'\xc3\x83\xc2\x93', 'Ó'.encode('utf-8')),
        (b'\xc3\x83\xc2\x9a', 'Ú'.encode('utf-8')),
        (b'\xc3\x83\xc2\xa1', 'á'.encode('utf-8')),
        (b'\xc3\x83\xc2\xa9', 'é'.encode('utf-8')),
        (b'\xc3\x83\xc2\xad', 'í'.encode('utf-8')),
        (b'\xc3\x83\xc2\xb3', 'ó'.encode('utf-8')),
        (b'\xc3\x83\xc2\xba', 'ú'.encode('utf-8')),
        (b'\xc3\x83\xc2\xb1', 'ñ'.encode('utf-8')),
        (b'\xc3\x83\x20', 'Á'.encode('utf-8')), # Album fix
        (b'\xc3\x83\xc2\xa2\xc3\xa2\xe2\x80\x9a\xc2\xac\xc3\x82\xc2\x93', '—'.encode('utf-8')),
        (b'\xc3\xb0\xc2\x9f\xc2\x90\xc2\x80', '🐀'.encode('utf-8')),
        (b'\xc3\xb0\xc2\x9f\xc2\x90\xc2\x86', '🐆'.encode('utf-8')),
        (b'\xc3\xb0\xc2\x9f\xc2\x91\xc2\xbb', '👻'.encode('utf-8')),
        (b'\xc3\xb0\xc2\x9f\xc2\x92\xc2\x80', '💀'.encode('utf-8')),
        (b'\xc3\xb0\xc2\x9f\xc2\x92\xc2\x9b', '💛'.encode('utf-8')),
        (b'\xc3\xb0\xc2\x9f\xc2\x92\xc2\x9c', '💜'.encode('utf-8')),
        (b'\xc3\xb0\xc2\x9f\xc2\x92\xc2\x9a', '💚'.encode('utf-8')),
        (b'\xc3\xb0\xc2\x9f\xc2\x96\xc2\xa4', '🖤'.encode('utf-8')),
        (b'\xc3\xa2\xc2\x9b\xc2\x93\xc3\xaf\xc2\xb8\xc2\x8f', '⛓️'.encode('utf-8')),
        (b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xa8', '🎨'.encode('utf-8')),
        (b'\xc3\xb0\xc2\x9f\xc2\x9a\xc2\xab', '🚫'.encode('utf-8')),
        (b'\xc3\xa2\xc2\x9a\xc2\xa1', '⚡'.encode('utf-8')),
    ]
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    text = content.decode('utf-8', errors='ignore')
    
    # 2. Fix duplicate head/body/style tags
    # We find the sequence </style></head><body
    # We want to keep ONLY the first one.
    
    parts = text.split('</style></head><body')
    if len(parts) > 2:
        print(f"Found {len(parts)-1} duplicate body starts. Cleaning...")
        # Keep everything up to the first one, then the rest but removing the head/body tags
        new_text = parts[0] + '</style></head><body' + parts[1]
        for part in parts[2:]:
            # Find the end of the body tag in this part
            body_end = part.find('>')
            new_text += part[body_end+1:]
        text = new_text

    # 3. FixIniciarApp to start boot sequence
    # Ensure window.iniciarApp calls runBootSequence()
    # and remove the window load event if it exists
    
    if 'window.iniciarApp = () => {' in text:
        if 'runBootSequence()' not in text.split('window.iniciarApp = () => {')[1].split('}')[0]:
             # Insert it at the start of the function
             text = text.replace('window.iniciarApp = () => {', 'window.iniciarApp = () => {\n    if (window.appIniciada) return;\n    window.appIniciada = true;\n    if (typeof runBootSequence === "function") runBootSequence();')
             
    # 4. Remove duplicate iniciarApp logic if any
    
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Cleanup complete.")

if __name__ == "__main__":
    fix_html()
