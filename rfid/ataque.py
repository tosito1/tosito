import serial
import time
import sys
import os

PUERTO = 'COM5'
BAUDIOS = 115200

def enviar_comando(comando, reintentos=3):
    """Envía un comando al Arduino y maneja la pérdida de conexión de la tarjeta."""
    for _ in range(reintentos):
        arduino.write((comando + '\n').encode())
        respuesta = arduino.readline().decode('utf-8').strip()
        if respuesta == "NO_CARD":
            sys.stdout.write("\r[!] Tarjeta no detectada. Manténla quieta... ")
            sys.stdout.flush()
            time.sleep(0.5)
            continue
        return respuesta
    return ""

# --- INICIALIZACIÓN ---
print("[*] Iniciando Framework de Auditoría RFID...")
try:
    arduino = serial.Serial(PUERTO, BAUDIOS, timeout=2)
    time.sleep(2)
except Exception as e:
    print(f"Error conectando al puerto {PUERTO}.")
    sys.exit(1)

try:
    with open('diccionario.txt', 'r') as f:
        diccionario = [linea.strip() for linea in f if len(linea.strip()) == 12]
except FileNotFoundError:
    print("Error: No se encuentra diccionario.txt")
    sys.exit(1)

print("\nPon la tarjeta sobre el lector para comenzar el análisis.")

# --- 1. OBTENER UID E INICIAR ARCHIVO ---
uid = ""
while not uid:
    resp = enviar_comando("UID")
    if resp.startswith("UID:"):
        uid = resp.split(":")[1]
        print(f"\n[+] Tarjeta detectada. UID: {uid}")

archivo_claves = f"{uid}_keys.txt"
archivo_dump = f"{uid}_dump.txt"
claves_conocidas = {}

# Leer claves si ya existía el archivo
if os.path.exists(archivo_claves):
    print(f"[*] Archivo {archivo_claves} encontrado. Cargando claves previas...")
    with open(archivo_claves, 'r') as f:
        for linea in f:
            if "Sector" in linea:
                partes = linea.strip().split(":")
                s_num = int(partes[0].replace("Sector", "").strip())
                claves_conocidas[s_num] = partes[1].strip()

# Escribir cabecera si es nuevo
if not os.path.exists(archivo_claves):
    with open(archivo_claves, 'w') as f:
        f.write(f"UID: {uid}\n")
        f.write("-" * 20 + "\n")

# --- 2. ATAQUE DE SECTORES ---
print("\n--- INICIANDO ESCANEO DE 16 SECTORES ---")
for sector in range(16):
    if sector in claves_conocidas:
        print(f"[*] Sector {sector}: Clave ya conocida -> {claves_conocidas[sector]}")
        continue
        
    trailer_block = sector * 4 + 3
    print(f"\n[*] Atacando Sector {sector}...")
    clave_encontrada = False
    
    for clave in diccionario:
        resp = enviar_comando(f"AUTH,{trailer_block},{clave}")
        
        if resp == "SUCCESS":
            print(f"[🚀] ¡BINGO! Sector {sector} abierto con: {clave}")
            claves_conocidas[sector] = clave
            with open(archivo_claves, 'a') as f:
                f.write(f"Sector {sector}: {clave}\n")
            clave_encontrada = True
            break
        elif resp == "FAIL":
            sys.stdout.write(f"\r[-] Probando {clave} -> Incorrecta.    ")
            sys.stdout.flush()

    if not clave_encontrada:
        print(f"\n[x] Diccionario agotado. Clave del Sector {sector} no encontrada.")

print(f"\n[+] Escaneo finalizado. Claves guardadas en {archivo_claves}")

# --- 3. VOLCADO DE MEMORIA (DUMP) ---
respuesta_usuario = input("\n¿Quieres realizar un volcado completo de la tarjeta (DUMP) ahora? (s/n): ")

if respuesta_usuario.lower() == 's':
    print(f"\n--- INICIANDO VOLCADO A {archivo_dump} ---")
    with open(archivo_dump, 'w') as f:
        f.write(f"DUMP DE TARJETA UID: {uid}\n")
        f.write("=" * 40 + "\n")
        
        for sector in range(16):
            f.write(f"\n+ SECTOR {sector}\n")
            if sector in claves_conocidas:
                clave = claves_conocidas[sector]
                for offset in range(4):
                    block = sector * 4 + offset
                    resp = enviar_comando(f"READ,{block},{clave}")
                    
                    if resp.startswith("DATA:"):
                        datos = resp.split(":")[1]
                        # Separar por espacios para que sea legible
                        datos_formateados = " ".join([datos[i:i+2] for i in range(0, len(datos), 2)])
                        f.write(f"Bloque {block:02d}: {datos_formateados}\n")
                        print(f"Bloque {block:02d}: {datos_formateados}")
                    else:
                        print(f"Bloque {block:02d}: Error de lectura")
                        f.write(f"Bloque {block:02d}: ERROR\n")
            else:
                print(f"Sector {sector}: Bloqueado (Sin clave)")
                f.write("ACCESO DENEGADO (Clave desconocida)\n")
                
    print(f"\n[🚀] ¡Volcado completado exitosamente en {archivo_dump}!")
else:
    print("\nSaliendo del framework. ¡Buen trabajo!")

arduino.close()