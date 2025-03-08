#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>
#include <WiFi.h>              // Built-in WiFi library
#include <WebSocketsClient.h>  // Install from Library Manager: "WebSocket Client" by Markus Sattler
#include <ArduinoJson.h>       // Install from Library Manager: "ArduinoJson" by Benoit Blanchon

// WiFi credentials
const char* ssid = "Chillin Cave";
const char* password = "mimamima";

// WebSocket server details
const char* websocket_server = "192.168.4.100";  // Replace with your computer's IP address
const int websocket_port = 8080;

// Define the pin for the buzzer
#define BUZZER_PIN 4

// RFID reader pins
MFRC522DriverPinSimple ss_pin(5);
MFRC522DriverSPI driver{ss_pin}; // Create SPI driver
MFRC522 mfrc522{driver};         // Create MFRC522 instance

// WebSocket client instance
WebSocketsClient webSocket;

// Last scanned card UID to prevent duplicates
String lastScannedUID = "";
unsigned long lastScanTime = 0;
const unsigned long SCAN_COOLDOWN = 1000; // 1 second cooldown between scans

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WebSocket] Disconnected!");
      break;
    case WStype_CONNECTED:
      {
        Serial.println("[WebSocket] Connected!");
        // Send device info
        StaticJsonDocument<200> doc;
        doc["type"] = "device_connect";
        doc["deviceId"] = "esp32-rfid-reader";
        doc["deviceType"] = "rfid_reader";
        
        String jsonString;
        serializeJson(doc, jsonString);
        webSocket.sendTXT(jsonString);
      }
      break;
    case WStype_TEXT:
      Serial.printf("[WebSocket] Received text: %s\n", payload);
      break;
  }
}

void setup() {
  Serial.begin(115200);
  while (!Serial);

  // Initialize hardware
  pinMode(BUZZER_PIN, OUTPUT);
  mfrc522.PCD_Init();
  MFRC522Debug::PCD_DumpVersionToSerial(mfrc522, Serial);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Configure and connect WebSocket client
  webSocket.begin(websocket_server, websocket_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  Serial.println(F("Ready to scan RFID cards"));
}

void loop() {
  webSocket.loop();  // Handle WebSocket events

  // Reset the loop if no new card present on the sensor/reader
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Create a string from the current UID
  String uidString = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) {
      uidString += "0";
    }
    uidString += String(mfrc522.uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();

  // Check if this is a new scan (not the same card within cooldown period)
  unsigned long currentTime = millis();
  if (uidString != lastScannedUID || (currentTime - lastScanTime) >= SCAN_COOLDOWN) {
    // Play sound
    tone(BUZZER_PIN, 2000, 200);

    // Update last scan info
    lastScannedUID = uidString;
    lastScanTime = currentTime;

    // Send to WebSocket server if connected
    if (webSocket.isConnected()) {
      StaticJsonDocument<200> doc;
      doc["type"] = "rfid_scan";
      doc["cardId"] = uidString;
      doc["deviceId"] = "esp32-rfid-reader";

      String jsonString;
      serializeJson(doc, jsonString);
      webSocket.sendTXT(jsonString);
      
      Serial.print("Sent to server - Card UID: ");
      Serial.println(uidString);
    } else {
      Serial.println("WebSocket not connected. Card UID: " + uidString);
    }
  }

  delay(50); // Small delay to prevent too rapid scanning
}
