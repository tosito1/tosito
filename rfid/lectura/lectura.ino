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

void loop() {
  if (Serial.available() > 0) {
    String payload = Serial.readStringUntil('\n');
    payload.trim();

    byte bufferATQA[2]; byte bufferSize = sizeof(bufferATQA);
    mfrc522.PICC_WakeupA(bufferATQA, &bufferSize);
    
    if (!mfrc522.PICC_ReadCardSerial()) { 
      Serial.println("NO_CARD"); 
      return; 
    }

    // --- COMANDO 1: OBTENER UID ---
    if (payload == "UID") {
      String uidStr = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (mfrc522.uid.uidByte[i] < 0x10) uidStr += "0";
        uidStr += String(mfrc522.uid.uidByte[i], HEX);
      }
      uidStr.toUpperCase();
      Serial.println("UID:" + uidStr);
      mfrc522.PICC_HaltA();
      return;
    }

    // --- COMANDO 2: FUERZA BRUTA (AUTH CLAVE A) ---
    if (payload.startsWith("AUTH,")) {
      int c1 = payload.indexOf(',');
      int c2 = payload.indexOf(',', c1 + 1);
      int block = payload.substring(c1 + 1, c2).toInt();
      String hexKey = payload.substring(c2 + 1);

      MFRC522::MIFARE_Key key;
      for (int i = 0; i < 6; i++) key.keyByte[i] = strtol(hexKey.substring(i*2, i*2+2).c_str(), NULL, 16);

      if (mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(mfrc522.uid)) == MFRC522::STATUS_OK) {
        Serial.println("SUCCESS");
      } else {
        Serial.println("FAIL");
      }
      mfrc522.PCD_StopCrypto1();
      mfrc522.PICC_HaltA();
      return;
    }

    // --- COMANDO 3: LEER DATOS (READ) ---
    if (payload.startsWith("READ,")) {
      int c1 = payload.indexOf(',');
      int c2 = payload.indexOf(',', c1 + 1);
      int block = payload.substring(c1 + 1, c2).toInt();
      String hexKey = payload.substring(c2 + 1);

      MFRC522::MIFARE_Key key;
      for (int i = 0; i < 6; i++) key.keyByte[i] = strtol(hexKey.substring(i*2, i*2+2).c_str(), NULL, 16);

      // Calculamos el Trailer Block necesario para autenticar este sector
      int trailer = (block / 4) * 4 + 3; 
      
      if (mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, trailer, &key, &(mfrc522.uid)) == MFRC522::STATUS_OK) {
        byte buffer[18]; byte size = sizeof(buffer);
        if (mfrc522.MIFARE_Read(block, buffer, &size) == MFRC522::STATUS_OK) {
          String dataStr = "";
          for (byte i = 0; i < 16; i++) {
            if (buffer[i] < 0x10) dataStr += "0";
            dataStr += String(buffer[i], HEX);
          }
          dataStr.toUpperCase();
          Serial.println("DATA:" + dataStr);
        } else {
          Serial.println("READ_FAIL");
        }
      } else {
        Serial.println("AUTH_FAIL");
      }
      mfrc522.PCD_StopCrypto1();
      mfrc522.PICC_HaltA();
    }
  }
}