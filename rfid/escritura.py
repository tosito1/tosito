import serial
import time
import sys

PUERTO = 'COM5' 
BAUDIOS = 115200
UID_TARJETA = 'E637450F' # Cambia esto si usas otra tarjeta
ARCHIVO_DUMP = f'{UID_TARJETA}_dump.txt' 
ARCHIVO_KEYS = f'{UID_TARJETA}_keys.txt'

def cloner():
    try:
        arduino = serial.Serial(PUERTO, BAUDIOS, timeout=2)
        time.sleep(2)
        print(f"[*] Conectado a Arduino en {PUERTO}")
    except:
        print("[-] Error: No se pudo conectar al Arduino."); return

    # 1. Cargar las claves desencriptadas (vital para que nos dejen escribir)
    claves_reales = {}
    try:
        with open(ARCHIVO_KEYS, 'r') as f:
            for linea in f:
                if "Sector" in linea:
                    partes = linea.strip().split(":")
                    s_num = int(partes[0].replace("Sector", "").strip())
                    claves_reales[s_num] = partes[1].strip()
        print(f"[*] Se han cargado las claves reales de {len(claves_reales)} sectores.")
    except FileNotFoundError:
        print(f"[-] Advertencia: No se encuentra {ARCHIVO_KEYS}. Se usará FFFFFFFFFFFF por defecto.")

    print("\n--- HERRAMIENTA AVANZADA RFID ---")
    print("[1] Clonación Completa - Magic Gen1 (Puerta Trasera)")
    print("[2] Clonación Completa - Magic Gen2 (Escritura Normal)")
    print("[3] Solo Datos Masivos (Sectores 1-15, salta Bloque 0)")
    print("[4] Restaurar bloque específico desde el DUMP")
    print("[5] ESCRITURA LIBRE (Inyectar código hexadecimal a mano)")
    
    opcion = input("\nSelecciona una opción: ")

    # =========================================================
    # NUEVO MODO: ESCRITURA LIBRE (OPCIÓN 5)
    # =========================================================
    if opcion == "5":
        print("\n--- MODO ESCRITURA LIBRE ---")
        try:
            sector = int(input("Introduce el Sector (0-15): "))
            bloque_interno = int(input("Introduce el Bloque dentro del sector (0-3): "))
            
            if sector < 0 or sector > 15 or bloque_interno < 0 or bloque_interno > 3:
                print("[-] Error: Sector o Bloque fuera de rango.")
                return

            datos_hex = input("Pega los datos HEX (32 caracteres sin espacios): ").strip().replace(" ", "").upper()
            
            if len(datos_hex) != 32:
                print(f"[-] Error: Has introducido {len(datos_hex)} caracteres. Deben ser exactamente 32.")
                return
                
            if bloque_interno == 3:
                seguro = input("¡PELIGRO! Vas a sobrescribir un Bloque Trailer (Contraseñas). ¿Seguro? (s/n): ")
                if seguro.lower() != 's': return

        except ValueError:
            print("[-] Entrada inválida.")
            return

        num_bloque = (sector * 4) + bloque_interno
        clave_target = claves_reales.get(sector, "FFFFFFFFFFFF")

        print(f"\n[!] Preparado para escribir en Sector {sector}, Bloque Absoluto {num_bloque}")
        print(f"[*] Usando llave de acceso: {clave_target}")
        print("[!] Coloca la tarjeta ahora y mantenla firme.")

        intentando = True
        while intentando:
            comando = f"WRITE,{num_bloque},{clave_target},{datos_hex}\n"
            arduino.write(comando.encode())
            res = arduino.readline().decode().strip()
            
            if res == "WRITE_SUCCESS":
                print(f"\n[🚀] ¡BINGO! Datos inyectados con éxito en el bloque {num_bloque}.")
                intentando = False
            elif res == "NO_CARD":
                sys.stdout.write(f"\r[!] ESPERANDO TARJETA...   ")
                sys.stdout.flush()
                time.sleep(0.5)
            elif res == "AUTH_FAIL":
                print(f"\n[x] AUTH_FAIL (La clave {clave_target} no abre este sector)")
                intentando = False
            else:
                print(f"\n[x] Error devuelto por Arduino: {res}")
                intentando = False
                
        arduino.close()
        return

    # =========================================================
    # MODOS CLÁSICOS: DESDE ARCHIVO DUMP (OPCIONES 1, 2, 3, 4)
    # =========================================================
    try:
        with open(ARCHIVO_DUMP, 'r') as f:
            lineas = [l for l in f.readlines() if "Bloque" in l]
    except FileNotFoundError:
        print(f"[-] Error: No se encuentra el archivo {ARCHIVO_DUMP}"); return

    if opcion == "4":
        try:
            bloque_objetivo = int(input("Introduce el número de bloque absoluto a restaurar (0-63): "))
        except ValueError:
            print("Número inválido."); return

    print("\n[!] PROCESO INICIADO. Coloca la tarjeta ahora y mantenla firme.")

    for linea in lineas:
        partes = linea.split(":")
        num_bloque = int(partes[0].replace("Bloque", "").strip())
        datos_hex = partes[1].replace(" ", "").strip()

        if opcion == "3" and num_bloque == 0: continue
        if opcion == "4" and num_bloque != bloque_objetivo: continue
        
        es_trailer = (num_bloque + 1) % 4 == 0
        if opcion != "4" and es_trailer:
            print(f"[*] Bloque {num_bloque:02d}: SALTADO (Protección de contraseñas activa)")
            continue
        
        sector_actual = num_bloque // 4
        clave_target = claves_reales.get(sector_actual, "FFFFFFFFFFFF")
        
        intentando = True
        while intentando:
            if opcion == "1" and num_bloque == 0:
                comando = f"MAGIC,{datos_hex}\n"
            else:
                comando = f"WRITE,{num_bloque},{clave_target},{datos_hex}\n"
                
            arduino.write(comando.encode())
            res = arduino.readline().decode().strip()
            
            if res == "WRITE_SUCCESS":
                if es_trailer:
                    print(f"[!] Bloque {num_bloque:02d}: OK (¡CUIDADO! Contraseña modificada)")
                else:
                    print(f"[+] Bloque {num_bloque:02d}: OK                     ")
                intentando = False 
            elif res == "NO_CARD":
                sys.stdout.write(f"\r[!] Bloque {num_bloque:02d}: ESPERANDO TARJETA...   ")
                sys.stdout.flush()
                time.sleep(0.5)
            elif res == "AUTH_FAIL":
                print(f"\n[x] Bloque {num_bloque:02d}: AUTH_FAIL (La clave {clave_target} no abre este sector)")
                intentando = False
            else:
                print(f"\n[x] Bloque {num_bloque:02d}: Error ({res})          ")
                intentando = False

    arduino.close()
    print("\n--- PROCESO FINALIZADO ---")

if __name__ == "__main__":
    cloner()