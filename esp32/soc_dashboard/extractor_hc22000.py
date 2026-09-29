#!/usr/bin/env python3
"""
HC22000 Extractor para Hashcat
=================================
Lee un archivo .pcap capturado por el ESP32 SOC y extrae los
paquetes EAPOL del 4-Way Handshake WPA2, generando el hash en formato
hc22000 (WPA*02*...) compatible con Hashcat -m 22000.

Uso:
    python extractor_hc22000.py <ruta_al_pcap>

Salida:
    Imprime las lineas hc22000 encontradas en stdout.
    Cada linea corresponde a un par M1+M2 capturado.
"""

import sys
import os
import json

try:
    from scapy.all import rdpcap, Dot11, Dot11Beacon, Dot11Elt, EAPOL
    from scapy.layers.dot11 import Dot11Auth
except ImportError:
    print(json.dumps({"error": "Scapy no está instalado. Ejecuta: pip install scapy"}))
    sys.exit(1)

def extract_ssid_from_pcap(packets):
    """Escanea el PCAP buscando tramas Beacon para extraer el SSID asociado a cada BSSID."""
    ap_ssids = {}
    for pkt in packets:
        if pkt.haslayer(Dot11Beacon):
            bssid = pkt[Dot11].addr3
            if bssid and bssid not in ap_ssids:
                elt = pkt[Dot11Elt]
                while elt:
                    if elt.ID == 0:  # SSID Element
                        ssid = elt.info
                        if ssid:
                            try:
                                ap_ssids[bssid.upper()] = ssid.decode('utf-8', errors='replace')
                            except:
                                ap_ssids[bssid.upper()] = ssid.hex()
                        break
                    elt = elt.payload if hasattr(elt, 'payload') and isinstance(elt.payload, Dot11Elt) else None
    return ap_ssids

def parse_eapol_key_info(key_info_bytes):
    """Parsea los 2 bytes de Key Information del mensaje EAPOL."""
    ki = int.from_bytes(key_info_bytes, 'big')
    key_descriptor_version = ki & 0x0007
    key_type = (ki >> 3) & 0x0001       # 1=Pairwise, 0=Group
    key_ack = (ki >> 7) & 0x0001        # ACK bit
    key_mic = (ki >> 8) & 0x0001        # MIC bit
    secure_bit = (ki >> 9) & 0x0001     # Secure bit
    key_install = (ki >> 6) & 0x0001    # Install bit
    return {
        'version': key_descriptor_version,
        'pairwise': key_type,
        'ack': key_ack,
        'mic': key_mic,
        'secure': secure_bit,
        'install': key_install,
        'raw': ki
    }

def identify_eapol_message(info):
    """Identifica M1, M2, M3, M4 del 4-Way Handshake."""
    if info['ack'] and not info['mic'] and info['pairwise']:
        return 'M1'
    elif not info['ack'] and info['mic'] and info['pairwise'] and not info['secure']:
        return 'M2'
    elif info['ack'] and info['mic'] and info['install'] and info['pairwise']:
        return 'M3'
    elif not info['ack'] and info['mic'] and info['secure'] and info['pairwise']:
        return 'M4'
    return None

def extract_eapol_fields(raw_eapol_bytes):
    """
    Extrae ANonce, SNonce y MIC del payload EAPOL bruto.
    Estructura EAPOL-Key:
      [0]     Descriptor Type (1 byte)
      [1-2]   Key Information (2 bytes)
      [3-4]   Key Length (2 bytes)
      [5-12]  Replay Counter (8 bytes)
      [13-44] WPA Key Nonce (32 bytes) <- ANonce o SNonce
      [45-60] Key IV (16 bytes)
      [61-68] Key RSC (8 bytes)
      [69-76] Reserved (8 bytes)
      [77-92] Key MIC (16 bytes)
      [93-94] Key Data Length (2 bytes)
      [95+]   Key Data
    """
    if len(raw_eapol_bytes) < 95:
        return None

    # Buscar el marcador EAPOL 0x888e en los bytes
    eapol_start = -1
    for i in range(len(raw_eapol_bytes) - 1):
        if raw_eapol_bytes[i] == 0x88 and raw_eapol_bytes[i+1] == 0x8e:
            eapol_start = i + 2  # Saltar los 2 bytes del EtherType
            break

    if eapol_start == -1 or eapol_start + 95 > len(raw_eapol_bytes):
        return None

    body = raw_eapol_bytes[eapol_start:]

    # body[0] = Protocol Version
    # body[1] = Type (Key = 3)
    # body[2-3] = Length
    # body[4] = Key Descriptor Type
    key_info_bytes = body[5:7]
    replay_counter = body[9:17]
    nonce = body[17:49]  # 32 bytes de Nonce
    key_iv = body[49:65]
    mic = body[81:97]    # 16 bytes de MIC
    key_data_len = int.from_bytes(body[97:99], 'big')
    key_data = body[99:99 + key_data_len]

    return {
        'key_info': key_info_bytes,
        'replay_counter': replay_counter,
        'nonce': nonce,
        'key_iv': key_iv,
        'mic': mic,
        'key_data': key_data,
        'key_data_len': key_data_len,
        'body_from_descriptor': body[4:]
    }

def extract_hc22000(pcap_path):
    """Función principal: lee el PCAP y construye las lineas hc22000."""
    if not os.path.exists(pcap_path):
        return {"error": f"Archivo no encontrado: {pcap_path}"}

    try:
        packets = rdpcap(pcap_path)
    except Exception as e:
        return {"error": f"No se pudo leer el archivo PCAP: {str(e)}"}

    ap_ssids = extract_ssid_from_pcap(packets)

    # Recolectar todos los paquetes EAPOL indexados por (AP_MAC, Client_MAC)
    handshakes = {}  # key: (bssid_upper, client_upper) -> {M1: pkt, M2: pkt, ...}

    for pkt in packets:
        # Detectar EAPOL buscando el EtherType 0x888e en los datos crudos
        raw = bytes(pkt)
        eapol_idx = -1
        for i in range(len(raw) - 1):
            if raw[i] == 0x88 and raw[i+1] == 0x8e:
                eapol_idx = i
                break

        if eapol_idx == -1:
            continue

        # Extraer direcciones MAC de la cabecera 802.11
        if not pkt.haslayer(Dot11):
            continue

        dot11 = pkt[Dot11]
        addr1 = (dot11.addr1 or '').upper()
        addr2 = (dot11.addr2 or '').upper()
        addr3 = (dot11.addr3 or '').upper()

        # Necesitamos al menos addr1 y addr2
        if not addr1 or not addr2:
            continue

        fields = extract_eapol_fields(raw[eapol_idx:])
        if not fields:
            continue

        key_info = parse_eapol_key_info(fields['key_info'])
        msg = identify_eapol_message(key_info)

        if not msg or msg not in ['M1', 'M2']:
            continue

        if msg == 'M1':
            # AP -> Client: addr2=AP (BSSID), addr1=Client
            bssid = addr2
            client = addr1
        else:
            # Client -> AP: addr2=Client, addr1=AP (BSSID)
            bssid = addr1
            client = addr2

        key = (bssid, client)
        if key not in handshakes:
            handshakes[key] = {}
        handshakes[key][msg] = {
            'nonce': fields['nonce'],
            'mic': fields['mic'],
            'key_data': fields['key_data'],
            'key_data_len': fields['key_data_len'],
            'raw_body': fields['body_from_descriptor'],
            'raw_full': raw[eapol_idx + 2:],  # Full EAPOL frame sin EtherType
        }

    # Construir las cadenas hc22000 para cada par M1+M2
    results = []

    for (bssid, client), msgs in handshakes.items():
        if 'M1' not in msgs or 'M2' not in msgs:
            continue

        m1 = msgs['M1']
        m2 = msgs['M2']

        # Buscar SSID asociado a este BSSID
        ssid_raw = None
        for b, s in ap_ssids.items():
            if b.upper() == bssid.upper():
                ssid_raw = s
                break
        if ssid_raw is None:
            ssid_raw = 'UNKNOWN'

        # Formatear MACs sin separadores
        bssid_clean = bssid.replace(':', '').replace('-', '').lower()
        client_clean = client.replace(':', '').replace('-', '').lower()

        # Nonces en hex
        anonce_hex = m1['nonce'].hex()
        snonce_hex = m2['nonce'].hex()

        # MIC del M2 en hex (el que necesita Hashcat para verificar)
        mic_hex = m2['mic'].hex()

        # EAPOL frame del M2 con MIC zeroeado (requerimiento hc22000)
        # El MIC en el frame empieza en el offset 77 del body desde Key Descriptor Type
        m2_body = bytearray(m2['raw_body'])
        # Zeroeamos los 16 bytes del MIC en el body (offset 77)
        if len(m2_body) > 93:
            for i in range(77, 93):
                m2_body[i] = 0x00
        eapol_frame_hex = m2_body.hex()

        # SSID en hex
        ssid_hex = ssid_raw.encode('utf-8').hex()

        # Formato final WPA*02*MIC*AP_MAC*CLIENT_MAC*SSID_HEX*ANONCE*EAPOL_FRAME
        hc22000_line = f"WPA*02*{mic_hex}*{bssid_clean}*{client_clean}*{ssid_hex}*{anonce_hex}*{eapol_frame_hex}*"

        results.append({
            'hash': hc22000_line,
            'ssid': ssid_raw,
            'bssid': bssid,
            'client': client,
            'mic': mic_hex,
            'anonce': anonce_hex,
            'snonce': snonce_hex,
            'messages_captured': list(msgs.keys()),
        })

    if not results:
        return {
            "error": "No se encontraron pares M1+M2 completos en el PCAP. Puede que el handshake esté incompleto.",
            "packets_analyzed": len(packets),
            "ssids_found": len(ap_ssids)
        }

    return {
        "success": True,
        "hashes": results,
        "total": len(results),
        "packets_analyzed": len(packets),
        "ssids_found": list(ap_ssids.values())
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Uso: python extractor_hc22000.py <ruta_al_pcap>"}))
        sys.exit(1)

    pcap_file = sys.argv[1]
    result = extract_hc22000(pcap_file)
    print(json.dumps(result, ensure_ascii=False))
