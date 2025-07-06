#include <WiFi.h>
#include <esp_now.h>
#include "DHT.h"

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

char node1Data[64] = "";  // Buffer for received data
uint8_t node3Mac[] = {0xC8, 0xF0, 0x9E, 0xA6, 0xC8, 0x08};  // ESP32-3

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed!");
    return;
  }

  // Register receive callback
  esp_now_register_recv_cb(onReceive);

  // Add ESP32-3 as peer
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, node3Mac, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  esp_now_add_peer(&peerInfo);

  Serial.println("ESP32-2 ready");
}

void onReceive(const esp_now_recv_info_t *info, const uint8_t *incomingData, int len) {
  memcpy(node1Data, incomingData, len);
  node1Data[len] = '\0';  // Null-terminate
  Serial.println("Received from Node1: " + String(node1Data));
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read own DHT22");
    delay(5000);
    return;
  }

  char finalMsg[128];
  snprintf(finalMsg, sizeof(finalMsg),
           "%s\nNODE2 -> Temp: %.2f C, Hum: %.2f %%", node1Data, t, h);

  esp_now_send(node3Mac, (uint8_t *)finalMsg, strlen(finalMsg));
  Serial.println("Sent to Node3: \n" + String(finalMsg));

  delay(5000);  // Send every 5s
}
