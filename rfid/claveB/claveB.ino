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

    // Comando esperado: B,9,AABBCCDDEEFF
    if (payload.startsWith("B,")) {
      int firstComma = payload.indexOf(',');
      int secondComma = payload.indexOf(',', firstComma + 1);
      
      int sector = payload.substring(firstComma + 1, secondComma).toInt();
      int trailerBlock = (sector * 4) + 3;
      String hexKey = payload.substring(secondComma + 1);

      MFRC522::MIFARE_Key key;
      for (int i = 0; i < 6; i++) {
        key.keyByte[i] = strtol(hexKey.substring(i * 2, i * 2 + 2).c_str(), NULL, 16);
      }

      // Despertar tarjeta
      byte bufferATQA[2]; byte bufferSize = sizeof(bufferATQA);
      mfrc522.PICC_WakeupA(bufferATQA, &bufferSize);
      if (!mfrc522.PICC_ReadCardSerial()) {
        Serial.println("N"); // No hay tarjeta
        return;
      }

      // Intentar Auth KEY B
      if (mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_B, trailerBlock, &key, &(mfrc522.uid)) == MFRC522::STATUS_OK) {
        Serial.println("OK:" + hexKey);
      } else {
        Serial.println("F"); // Fail
      }
      
      mfrc522.PCD_StopCrypto1();
      mfrc522.PICC_HaltA();
    }
  }
}