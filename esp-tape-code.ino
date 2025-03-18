#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// Define pins for RFID readers
#define SS_PIN_1 21   // RFID Reader 1
#define SS_PIN_2 2    // RFID Reader 2
#define SS_PIN_3 15   // RFID Reader 3
#define SS_PIN_4 5    // RFID Reader 4 (Card Scanner)
#define BUZZER_PIN 4  // Buzzer connected to D4

// WiFi credentials
const char* ssid = "Chillin Cave";
const char* password = "mimamima";

// WebSocket server details - UPDATED FOR RAILWAY
const char* websocket_server = "breaking-news-ws-server-production.up.railway.app";
const int websocket_port = 443; // Use port 443 for secure connections

// WebSocket client instance
WebSocketsClient webSocket;

// Debounce and stable detection configuration
const unsigned long DEBOUNCE_DELAY = 800;   // Ignore repeated scans within 800ms
const unsigned long STABLE_READ_TIME = 1000; // Must be absent for 1 second before "removed"
const unsigned long WEBSOCKET_CHECK_INTERVAL = 50; // Check WebSocket every 50ms

unsigned long lastReadTimes[4] = {0, 0, 0, 0}; // Last read timestamp
unsigned long lastSeenTimes[4] = {0, 0, 0, 0}; // Last time the card was seen
unsigned long lastWebSocketCheck = 0; // Last time WebSocket was checked

// Reader state tracking
struct ReaderState {
    bool cardPresent;
    String lastUID;
};

ReaderState readerStates[4] = {{false, ""}, {false, ""}, {false, ""}, {false, ""}};

// Define SPI drivers for RFID readers
MFRC522DriverPinSimple ss_pin1(SS_PIN_1);
MFRC522DriverPinSimple ss_pin2(SS_PIN_2);
MFRC522DriverPinSimple ss_pin3(SS_PIN_3);
MFRC522DriverPinSimple ss_pin4(SS_PIN_4);
MFRC522DriverSPI driver1{ss_pin1};
MFRC522DriverSPI driver2{ss_pin2};
MFRC522DriverSPI driver3{ss_pin3};
MFRC522DriverSPI driver4{ss_pin4};

// Create MFRC522 instances
MFRC522 rfid1{driver1};
MFRC522 rfid2{driver2};
MFRC522 rfid3{driver3};
MFRC522 rfid4{driver4};

// WiFi connection status
bool wifiConnected = false;
bool wsConnected = false;

// WebSocket event handler
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.println("[WebSocket] Disconnected!");
            wsConnected = false;
            break;
        case WStype_CONNECTED:
            {
                Serial.println("[WebSocket] Connected!");
                wsConnected = true;
                // Send device connection message
                StaticJsonDocument<200> doc;
                doc["type"] = "device_connect";
                doc["deviceId"] = "esp32-003";
                doc["deviceType"] = "rfid_reader";
                
                String jsonString;
                serializeJson(doc, jsonString);
                webSocket.sendTXT(jsonString);
            }
            break;
        case WStype_TEXT:
            // Process only if needed, keep this minimal
            break;
        case WStype_ERROR:
            Serial.printf("[WebSocket] Error: %u\n", length);
            break;
        default:
            // Ignore other events to reduce processing time
            break;
    }
}

void setup() {
    Serial.begin(115200);
    while (!Serial);
    pinMode(BUZZER_PIN, OUTPUT); // Initialize the buzzer pin as an output

    // Initialize RFID readers
    rfid1.PCD_Init();
    rfid2.PCD_Init();
    rfid3.PCD_Init();
    rfid4.PCD_Init();

    Serial.println(F("RFID Readers Initialized"));
    
    // Start WiFi connection in the background
    WiFi.begin(ssid, password);
    Serial.println("Connecting to WiFi in background...");
    
    // Configure WebSocket client
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
    
    Serial.println(F("Scan cards on any reader."));
}

void loop() {
    unsigned long currentTime = millis();
    
    // Check WiFi and WebSocket status periodically without blocking
    if (currentTime - lastWebSocketCheck >= WEBSOCKET_CHECK_INTERVAL) {
        lastWebSocketCheck = currentTime;
        
        // Check WiFi status
        if (WiFi.status() == WL_CONNECTED && !wifiConnected) {
            wifiConnected = true;
            Serial.println("\nConnected to WiFi");
            Serial.print("IP Address: ");
            Serial.println(WiFi.localIP());
            
            // Configure and connect WebSocket client
            Serial.print("Connecting to WebSocket server: ");
            Serial.println(websocket_server);
            webSocket.beginSSL(websocket_server, websocket_port, "/");
        }
        
        // Only process WebSocket if WiFi is connected
        if (wifiConnected) {
            webSocket.loop();
        }
    }
    
    // Check RFID readers - this is the core functionality
    checkRFID(rfid1, "Reader 1", 0);
    checkRFID(rfid2, "Reader 2", 1);
    checkRFID(rfid3, "Reader 3", 2);
    checkRFID(rfid4, "Reader 4", 3);

    detectCardRemoval(); // Check for stable removals
    
    // Minimal delay to prevent CPU overload but maintain responsiveness
    delay(10);
}

void checkRFID(MFRC522 &rfid, const char* readerName, int readerIndex) {
    unsigned long currentTime = millis();

    // Check for new card
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
        String uidString = "";
        for (byte i = 0; i < rfid.uid.size; i++) {
            if (rfid.uid.uidByte[i] < 0x10) {
                uidString += "0";
            }
            uidString += String(rfid.uid.uidByte[i], HEX);
        }
        uidString.toUpperCase();

        // First detection or new card detected
        if (!readerStates[readerIndex].cardPresent || readerStates[readerIndex].lastUID != uidString) {
            tone(BUZZER_PIN, 2000, 200);
            Serial.print(readerName);
            Serial.print(" - Card UID: ");
            Serial.println(uidString);

            // Update state
            readerStates[readerIndex].cardPresent = true;
            readerStates[readerIndex].lastUID = uidString;
            
            // Send card detection event to WebSocket server if connected
            if (wifiConnected && wsConnected) {
                StaticJsonDocument<200> doc;
                doc["type"] = "rfid_scan";
                doc["cardId"] = uidString;
                doc["deviceId"] = "esp32-003";
                doc["readerId"] = readerIndex + 1; // Add reader ID (1-4)
                
                String jsonString;
                serializeJson(doc, jsonString);
                webSocket.sendTXT(jsonString);
                
                Serial.print("Sent to server - ");
                Serial.print(readerName);
                Serial.print(" Card UID: ");
                Serial.println(uidString);
            }
        }
        // Update last seen time
        lastSeenTimes[readerIndex] = currentTime;
    }
}

void detectCardRemoval() {
    unsigned long currentTime = millis();

    for (int i = 0; i < 4; i++) {
        if (readerStates[i].cardPresent) {
            // If no new scan for a stable time, consider it removed
            if (currentTime - lastSeenTimes[i] > STABLE_READ_TIME) {
                Serial.print("Reader ");
                Serial.print(i + 1);
                Serial.println(" - Card removed");

                // Print the last known UID before clearing it
                Serial.print("Last UID: ");
                Serial.println(readerStates[i].lastUID);
                
                // Send card removal event to WebSocket server if connected
                if (wifiConnected && wsConnected) {
                    StaticJsonDocument<200> doc;
                    doc["type"] = "rfid_removal";
                    doc["cardId"] = readerStates[i].lastUID;
                    doc["deviceId"] = "esp32-003";
                    doc["readerId"] = i + 1; // Add reader ID (1-4)
                    
                    String jsonString;
                    serializeJson(doc, jsonString);
                    webSocket.sendTXT(jsonString);
                    
                    Serial.print("Sent removal event to server - Reader ");
                    Serial.print(i + 1);
                    Serial.println(readerStates[i].lastUID);
                }

                // Reset state
                readerStates[i].cardPresent = false;
                readerStates[i].lastUID = "";
            }
        }
    }
}