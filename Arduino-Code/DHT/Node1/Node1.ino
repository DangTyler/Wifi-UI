//NODE1 - COM5
#include <WiFi.h>
#include <esp_now.h>
#include "DHT.h"

#define DHTPIN 4          // GPIO connected to DHT22 data pin
#define DHTTYPE DHT22     // Type of DHT sensor

DHT dht(DHTPIN, DHTTYPE);

// Replace with receiver ESP32 MAC address
uint8_t receiverMac[] = {0xC8, 0xF0, 0x9E, 0xA6, 0xC7, 0x9C};  // Example MAC

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.mode(WIFI_STA);  // Set ESP32 as Wi-Fi station

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed!");
    return;
  }

  // Add receiver as peer
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, receiverMac, 6);
  peerInfo.channel = 0;  // same channel
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }

  Serial.println("ESP-NOW + DHT22 sender ready");
}

void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    // Format message
    char msg[64];
    snprintf(msg, sizeof(msg), "\nNODE1 -> Temp: %.2f C, Humidity: %.2f %%", temperature, humidity);

    // Send via ESP-NOW
    esp_err_t result = esp_now_send(receiverMac, (uint8_t *)msg, strlen(msg));

    if (result == ESP_OK) {
      Serial.print("Sent: ");
      Serial.println(msg);
    } else {
      Serial.println("Failed to send message");
    }
  }

  delay(5000);  // Read and send every 5 seconds
}
