def generador_fuerza_bruta_masiva():
    uid = "E637450F"
    master = "0B02070A0409"
    sector = "09"
    
    claves_finales = set()
    print("Generando diccionario masivo... Esto puede tardar unos segundos en tu PC.")

    # 1. FUERZA BRUTA DE LA CLAVE MAESTRA (Faltan 2 bytes)
    # Patrón: Primeros 4 bytes de Master + 2 bytes de Fuerza Bruta (65.536 claves)
    base_master_inicio = master[:8]  # "0B02070A"
    for i in range(65536):
        claves_finales.add(f"{base_master_inicio}{i:04X}")

    # Patrón: Últimos 4 bytes de Master + 2 bytes de Fuerza Bruta (65.536 claves)
    base_master_fin = master[-8:]    # "070A0409"
    for i in range(65536):
        claves_finales.add(f"{i:04X}{base_master_fin}")

    # 2. FUERZA BRUTA DEL UID (Faltan 2 bytes)
    # Patrón: Tu UID + 2 bytes de Fuerza Bruta (65.536 claves)
    for i in range(65536):
        claves_finales.add(f"{uid}{i:04X}")
        # Y con el UID al revés (Little Endian)
        claves_finales.add(f"0F4537E6{i:04X}")

    # 3. FUERZA BRUTA MIXTA (UID + SECTOR + 1 BYTE)
    # Patrón: UID + Sector 09 + 1 byte de Fuerza Bruta (256 claves, pero muy probables)
    for i in range(256):
        claves_finales.add(f"{uid[:8]}{sector}{i:02X}")
        claves_finales.add(f"{i:02X}{uid[:8]}{sector}")

    # 4. PATRONES DE REPETICIÓN DEL CÓDIGO FUENTE
    # A veces los programadores rellenan con el mismo byte
    for i in range(256):
        hex_byte = f"{i:02X}"
        claves_finales.add(f"0B0207{hex_byte}{hex_byte}{hex_byte}")
        claves_finales.add(f"{hex_byte}{hex_byte}{hex_byte}0A0409")

    # Imprimir resumen y exportar
    lista_ordenada = sorted(claves_finales)
    total = len(lista_ordenada)
    
    print(f"\n¡Proceso Terminado! Se han generado {total} CLAVES ÚNICAS.")
    print("Guardando en el archivo 'diccionario_nuclear_sector9.txt'...")

    # Como imprimir 130,000 líneas bloquea la consola, lo guardamos en un archivo de texto
    with open("diccionario_nuclear_sector9.txt", "w") as archivo:
        for clave in lista_ordenada:
            archivo.write(clave + "\n")
            
    print("Archivo guardado con éxito. Pásalo a tu móvil.")

if __name__ == "__main__":
    generador_fuerza_bruta_masiva()