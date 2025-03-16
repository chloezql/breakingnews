#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>

// Define pins for RFID readers
#define SS_PIN_1 21   // RFID Reader 1
#define SS_PIN_2 2    // RFID Reader 2
#define SS_PIN_3 15   // RFID Reader 3
#define BUZZER_PIN 4  // Buzzer connected to D4

// Debounce and stable detection configuration
const unsigned long DEBOUNCE_DELAY = 800;   // Ignore repeated scans within 800ms
const unsigned long STABLE_READ_TIME = 1000; // Must be absent for 1 second before "removed"

unsigned long lastReadTimes[3] = {0, 0, 0}; // Last read timestamp
unsigned long lastSeenTimes[3] = {0, 0, 0}; // Last time the card was seen

// Reader state tracking
struct ReaderState {
    bool cardPresent;
    String lastUID;
};

ReaderState readerStates[3] = {{false, ""}, {false, ""}, {false, ""}};

// Define SPI drivers for RFID readers
MFRC522DriverPinSimple ss_pin1(SS_PIN_1);
MFRC522DriverPinSimple ss_pin2(SS_PIN_2);
MFRC522DriverPinSimple ss_pin3(SS_PIN_3);
MFRC522DriverSPI driver1{ss_pin1};
MFRC522DriverSPI driver2{ss_pin2};
MFRC522DriverSPI driver3{ss_pin3};

// Create MFRC522 instances
MFRC522 rfid1{driver1};
MFRC522 rfid2{driver2};
MFRC522 rfid3{driver3};

void setup() {
    Serial.begin(115200);
    while (!Serial);
    pinMode(BUZZER_PIN, OUTPUT); // Initialize the buzzer pin as an output

    // Initialize RFID readers
    rfid1.PCD_Init();
    rfid2.PCD_Init();
    rfid3.PCD_Init();

    Serial.println(F("RFID Readers Initialized"));
    Serial.println(F("Scan cards on any reader."));
}
void loop() {
    checkRFID(rfid1, "Reader 1", 0);
    checkRFID(rfid2, "Reader 2", 1);
    checkRFID(rfid3, "Reader 3", 2);

    detectCardRemoval(); // Check for stable removals
    delay(200); // Reduced delay for faster updates
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
        }
// Update last seen time
        lastSeenTimes[readerIndex] = currentTime;
    }
}

void detectCardRemoval() {
    unsigned long currentTime = millis();

    for (int i = 0; i < 3; i++) {
        if (readerStates[i].cardPresent) {
            // If no new scan for a stable time, consider it removed
            if (currentTime - lastSeenTimes[i] > STABLE_READ_TIME) {
                Serial.print("Reader ");
                Serial.print(i + 1);
                Serial.println(" - Card removed");

                // Print the last known UID before clearing it
                Serial.print("Last UID: ");
                Serial.println(readerStates[i].lastUID);

                // Reset state
                readerStates[i].cardPresent = false;
                readerStates[i].lastUID = "";
            }
        }
    }
}