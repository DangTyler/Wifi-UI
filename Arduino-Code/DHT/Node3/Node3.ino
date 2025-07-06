#include <WiFi.h>
#include <esp_now.h>

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed!");
    return;
  }

  esp_now_register_recv_cb(onReceive);

  Serial.println("ESP32-3 ready to receive");
}

void onReceive(const esp_now_recv_info_t *info, const uint8_t *incomingData, int len) {
  char msg[len + 1];
  memcpy(msg, incomingData, len);
  msg[len] = '\0';

  Serial.println("\n📥 Data received:" + String(msg));
}

void loop() {
  // Do nothing; passive logger
}
