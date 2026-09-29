#include "WiFi.h"
#include "esp_wifi.h"

// Variable para contar los paquetes interceptados
volatile int packetCount = 0;

// Esta función se dispara automáticamente cada vez que la antena captura un paquete
void IRAM_ATTR promiscuous_rx_cb(void *buf, wifi_promiscuous_pkt_type_t type) {
  packetCount++;
}

void setup() {
  Serial.begin(115200);
  
  // Ponemos el ESP32 en modo estación y nos aseguramos de no estar conectados a nada
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  // Activamos el modo promiscuo
  esp_wifi_set_promiscuous(true);
  
  // Le decimos al ESP32 qué función ejecutar cuando escuche algo
  esp_wifi_set_promiscuous_rx_cb(&promiscuous_rx_cb);
  
  // Sintonizamos la antena en el Canal 6 (puedes cambiarlo del 1 al 13)
  esp_wifi_set_channel(6, WIFI_SECOND_CHAN_NONE);
  
  Serial.println("=========================================");
  Serial.println("MODO PROMISCUO ACTIVADO (Sniffer) 📡");
  Serial.println("Sintonizado en el Canal 6");
  Serial.println("=========================================");
}

void loop() {
  // Esperamos 1 segundo
  delay(1000);
  
  // Mostramos cuántos paquetes crudos flotan en el aire cada segundo
  Serial.print("Paquetes interceptados en el último segundo: ");
  Serial.println(packetCount);
  
  // Reiniciamos el contador
  packetCount = 0; 
}