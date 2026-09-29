#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN 9
#define SS_PIN 10
MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
}

// Función especial para saltar la seguridad del Bloque 0 en tarjetas MAGIC Gen1
bool writeMagicBlock0(byte* data) {
  mfrc522.PICC_HaltA();
  if (mfrc522.PCD_TransceiveData((byte*)"\x40", 1, NULL, 0, NULL, 0, false) != MFRC522::STATUS_OK) return false;
  if (mfrc522.PCD_TransceiveData((byte*)"\x43", 1, NULL, 0, NULL, 0, false) != MFRC522::STATUS_OK) return false;
  return (mfrc522.MIFARE_Write(0, data, 16) == MFRC522::STATUS_OK);
}

void loop() {
  if (Serial.available() > 0) {
    String payload = Serial.readStringUntil('\n');
    payload.trim();

    // 1. Despertar la tarjeta y comprobar si sigue ahí
    byte bufferATQA[2]; byte bufferSize = sizeof(bufferATQA);
    mfrc522.PICC_WakeupA(bufferATQA, &bufferSize);
    if (!mfrc522.PICC_ReadCardSerial()) { 
      Serial.println("NO_CARD"); 
      return; 
    }

    // --- COMANDO MAGIC (Solo para Opción 1 de Python: Bloque 0 Gen1) ---
    if (payload.startsWith("MAGIC,")) {
      String hexData = payload.substring(6);
      byte dataBlock[16];
      for (int i = 0; i < 16; i++) dataBlock[i] = strtol(hexData.substring(i*2, i*2+2).c_str(), NULL, 16);
      
      if (writeMagicBlock0(dataBlock)) Serial.println("WRITE_SUCCESS");
      else Serial.println("MAGIC_FAIL");
      
      mfrc522.PCD_StopCrypto1(); mfrc522.PICC_HaltA();
    }
    
    // --- COMANDO WRITE NORMAL (Sectores 1-15, Opción 5 Manual, y Gen2) ---
    else if (payload.startsWith("WRITE,")) {
      int c1 = payload.indexOf(',');
      int c2 = payload.indexOf(',', c1 + 1);
      int c3 = payload.indexOf(',', c2 + 1);
      
      int block = payload.substring(c1 + 1, c2).toInt();
      String hexKey = payload.substring(c2 + 1, c3);
      String hexData = payload.substring(c3 + 1);

      // Convertir datos Hex a bytes
      byte dataBlock[16];
      for (int i = 0; i < 16; i++) dataBlock[i] = strtol(hexData.substring(i*2, i*2+2).c_str(), NULL, 16);

      // Convertir clave Hex a estructura de MIFARE
      MFRC522::MIFARE_Key key;
      for (int i = 0; i < 6; i++) key.keyByte[i] = strtol(hexKey.substring(i*2, i*2+2).c_str(), NULL, 16);
      
      // Calcular cuál es el bloque de contraseñas de este sector
      int trailer = (block / 4) * 4 + 3;
      
      // Autenticar e Inyectar
      if (mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, trailer, &key, &(mfrc522.uid)) == MFRC522::STATUS_OK) {
        if (mfrc522.MIFARE_Write(block, dataBlock, 16) == MFRC522::STATUS_OK) {
          Serial.println("WRITE_SUCCESS");
        } else {
          Serial.println("WRITE_FAIL");
        }
      } else {
        Serial.println("AUTH_FAIL");
      }
      
      mfrc522.PCD_StopCrypto1(); mfrc522.PICC_HaltA();
    }
  }
}