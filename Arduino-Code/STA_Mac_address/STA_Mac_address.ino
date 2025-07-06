#include <WiFi.h>

void setup() 
{
  Serial.begin(115200);
  delay(1000);

  WiFi.mode(WIFI_STA);  // Initialize both AP and STA
  delay(100);              // Let Wi-Fi settle
  String staMac = WiFi.macAddress();
  Serial.println("----- MAC Address Info -----");
  Serial.print("STA MAC: "); Serial.println(staMac);
}

void loop() 
{
  
}

