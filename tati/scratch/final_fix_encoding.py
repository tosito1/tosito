
import os

target_file = r'c:\Users\Tosito\Desktop\Tosito\tati\index.html'

def final_fix():
    with open(target_file, 'rb') as f:
        data = f.read()
    
    # Mojibake replacements (UTF-8 bytes misread as ISO-8859-1 and then re-encoded as UTF-8)
    # This happens when you save a file with the wrong encoding.
    
    replacements = [
        (b'\xc3\x83\xc2\xa1', 'á'.encode('utf-8')),
        (b'\xc3\x83\xc2\xa9', 'é'.encode('utf-8')),
        (b'\xc3\x83\xc2\xad', 'í'.encode('utf-8')),
        (b'\xc3\x83\xc2\xb3', 'ó'.encode('utf-8')),
        (b'\xc3\x83\xc2\xba', 'ú'.encode('utf-8')),
        (b'\xc3\x83\xc2\xb1', 'ñ'.encode('utf-8')),
        (b'\xc3\x83\xc2\x81', 'Á'.encode('utf-8')),
        (b'\xc3\x83\xc2\x89', 'É'.encode('utf-8')),
        (b'\xc3\x83\xc2\x8d', 'Í'.encode('utf-8')),
        (b'\xc3\x83\xc2\x93', 'Ó'.encode('utf-8')),
        (b'\xc3\x83\xc2\x9a', 'Ú'.encode('utf-8')),
        (b'\xc3\x83\x20', 'Á'.encode('utf-8')), # Specially for "Ã lbum"
        (b'\xc3\x81', 'Á'.encode('utf-8')),
        (b'\xc3\xad', 'í'.encode('utf-8')),
        (b'\xc3\xb1', 'ñ'.encode('utf-8')),
    ]
    
    for old, new in replacements:
        data = data.replace(old, new)
        
    text = data.decode('utf-8', errors='ignore')
    
    # Fix the duplicateiciarApp logic
    bad_logic = """window.appIniciada = true;
    if (typeof runBootSequence === "function") runBootSequence();
    if (window.appIniciada) return;
    window.appIniciada = true;"""
    
    good_logic = """if (window.appIniciada) return;
    window.appIniciada = true;
    if (typeof runBootSequence === "function") runBootSequence();"""
    
    text = text.replace(bad_logic, good_logic)
    
    # Ensure main-content is visible when iniciarApp runs (if not already handled by boot sequence)
    # The boot sequence usually handles this, but let's be sure.
    
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Final fix applied.")

if __name__ == "__main__":
    final_fix()
