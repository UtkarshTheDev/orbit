// USER DETECTION TEST FIRMWARE
// High-quality debugging and logging for motion detection issues
// Focus: PIR sensor reliability and WebSocket event verification

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ============================================ 
// WiFi & WebSocket Configuration
// ============================================ 
const char* ssid = "Computerlabjio";
const char* password = "pass@0009";
const char* ws_host = "orbit-5awh.onrender.com";
const int ws_port = 443;
const char* ws_path = "/ws";

// ============================================ 
// PIN DEFINITIONS
// ============================================ 
#define PIR_PIN 14
#define TRIG_PIN 13
#define ECHO_PIN 18
#define LED_PIN 2

// ============================================ 
// ULTRASONIC MODE
// ============================================ 
#define ULTRASONIC_REAL_MODE true

// ============================================ 
// DETECTION THRESHOLDS
// ============================================ 
#define DISTANCE_VERY_CLOSE 50
#define DISTANCE_CLOSE 100
#define DISTANCE_VIEWING 150
#define DISTANCE_FAR 200

// ============================================ 
// TIMING CONFIGURATION
// ============================================ 
const unsigned long PIR_READ_INTERVAL = 50;        // Read PIR every 50ms (20Hz)
const unsigned long DISTANCE_CHECK_INTERVAL = 200; // Check distance every 200ms
const unsigned long STATUS_PRINT_INTERVAL = 2000;  // Print status every 2s
const unsigned long PIR_DEBOUNCE_MS = 100;         // Debounce PIR for 100ms

// ============================================ 
// GLOBAL VARIABLES
// ============================================ 
WebSocketsClient webSocket;
bool isConnected = false;
String clientId = "";

// PIR tracking
int pirState = LOW;
int lastPirState = LOW;
unsigned long lastPirChangeTime = 0;
unsigned long lastPirReadTime = 0;
unsigned long pirHighStartTime = 0;
unsigned long pirHighDuration = 0;
unsigned long totalMotionDetections = 0;
unsigned long missedMotionCount = 0;

// Distance tracking
float currentDistance = 999.0;
float lastDistance = 999.0;
unsigned long lastDistanceCheck = 0;
unsigned long distanceMeasurementCount = 0;

// Status tracking
unsigned long lastStatusPrint = 0;
unsigned long loopCount = 0;
unsigned long lastLoopTime = 0;

// Event tracking
unsigned long lastMotionEventSent = 0;
unsigned long lastUserArrivedSent = 0;
unsigned long lastUserPassedSent = 0;
bool userPresent = false;

// Debug flags
bool verboseLogging = true;
bool logPirChanges = true;
bool logDistanceChanges = true;
bool logWebSocketEvents = true;

// ============================================ 
// FUNCTION DECLARATIONS
// ============================================ 
void handleSerialCommands();
void printDetailedStatus();
void printPirStats();
float measureDistance();
void checkPirSensor(unsigned long currentTime);
void checkDistance(unsigned long currentTime);
void sendMotionDetected();
void sendUserArrived(float distance);
void sendUserPassed(float distance);

// ============================================ 
// WEBSOCKET FUNCTIONS
// ============================================ 
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("\n[WS] ❌ DISCONNECTED");
      isConnected = false;
      clientId = "";
      break;
      
    case WStype_CONNECTED:
      Serial.printf("\n[WS] ✅ CONNECTED to: %s\n", payload);
      isConnected = true;
      {
        StaticJsonDocument<200> doc;
        doc["type"] = "identify";
        doc["role"] = "esp32_sensor";
        String msg;
        serializeJson(doc, msg);
        webSocket.sendTXT(msg);
        Serial.println("[WS] 📤 Sent identification");
      }
      break;
      
    case WStype_TEXT:
      if (logWebSocketEvents) {
        Serial.printf("[WS] 📥 Received: %s\n", payload);
      }
      {
        DynamicJsonDocument doc(512);
        DeserializationError error = deserializeJson(doc, payload);
        if (!error) {
          const char* type = doc["type"];
          if (type && strcmp(type, "connected") == 0) {
            clientId = doc["clientId"].as<String>();
            Serial.printf("[WS] 🆔 Client ID: %s\n", clientId.c_str());
          }
        }
      }
      break;
      
    case WStype_ERROR:
      Serial.println("[WS] ⚠️ ERROR");
      break;
      
    case WStype_PING:
      if (verboseLogging) Serial.println("[WS] 🏓 PING");
      break;
      
    case WStype_PONG:
      if (verboseLogging) Serial.println("[WS] 🏓 PONG");
      break;
  }
}

void sendMotionDetected() {
  if (!isConnected) {
    Serial.println("[WS] ⚠️ Cannot send motion_detected - not connected");
    return;
  }
  
  StaticJsonDocument<256> doc;
  doc["type"] = "motion_detected";
  doc["timestamp"] = millis();
  doc["sensor"] = "PIR";
  doc["pirDuration"] = pirHighDuration;
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  
  lastMotionEventSent = millis();
  Serial.println("\n[WS] 📤 SENT: motion_detected");
  Serial.printf("     └─ PIR duration: %lu ms\n", pirHighDuration);
}

void sendUserArrived(float distance) {
  if (!isConnected) return;
  
  StaticJsonDocument<300> doc;
  doc["type"] = "user_arrived";
  doc["message"] = "User arrived near the tablet";
  doc["distance"] = distance;
  doc["timestamp"] = millis();
  doc["sensor"] = "ultrasonic";
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  
  lastUserArrivedSent = millis();
  Serial.println("\n[WS] 📤 SENT: user_arrived");
  Serial.printf("     └─ Distance: %.1f cm\n", distance);
}

void sendUserPassed(float distance) {
  if (!isConnected) return;
  
  StaticJsonDocument<300> doc;
  doc["type"] = "user_passed";
  doc["message"] = "User passed by the tablet";
  doc["distance"] = distance;
  doc["timestamp"] = millis();
  doc["sensor"] = "ultrasonic";
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  
  lastUserPassedSent = millis();
  Serial.println("\n[WS] 📤 SENT: user_passed");
  Serial.printf("     └─ Distance: %.1f cm\n", distance);
}

// ============================================ 
// PIR SENSOR FUNCTIONS
// ============================================ 
void checkPirSensor(unsigned long currentTime) {
  // Read PIR at fixed intervals
  if (currentTime - lastPirReadTime < PIR_READ_INTERVAL) {
    return;
  }
  lastPirReadTime = currentTime;
  
  // Read current PIR state
  pirState = digitalRead(PIR_PIN);
  
  // Detect state changes
  if (pirState != lastPirState) {
    // Debounce: ensure state is stable
    if (currentTime - lastPirChangeTime > PIR_DEBOUNCE_MS) {
      
      if (pirState == HIGH) {
        // Motion detected
        pirHighStartTime = currentTime;
        totalMotionDetections++;
        digitalWrite(LED_PIN, HIGH);
        
        if (logPirChanges) {
          Serial.println("\n╔═══════════════════════════════════════╗");
          Serial.println("║  🚨 PIR MOTION DETECTED               ║");
          Serial.println("╚═══════════════════════════════════════╝");
          Serial.printf("   Time: %lu ms\n", currentTime);
          Serial.printf("   Detection #%lu\n", totalMotionDetections);
        }
        
        // Send WebSocket event
        sendMotionDetected();
        
      } else {
        // Motion ended
        pirHighDuration = currentTime - pirHighStartTime;
        digitalWrite(LED_PIN, LOW);
        
        if (logPirChanges) {
          Serial.println("\n╔═══════════════════════════════════════╗");
          Serial.println("║  ✋ PIR MOTION ENDED                  ║");
          Serial.println("╚═══════════════════════════════════════╝");
          Serial.printf("   Duration: %lu ms\n", pirHighDuration);
        }
      }
      
      lastPirChangeTime = currentTime;
      lastPirState = pirState;
    }
  }
  
  // Log continuous HIGH state
  if (pirState == HIGH && verboseLogging) {
    unsigned long duration = currentTime - pirHighStartTime;
    if (duration % 1000 == 0 && duration > 0) {
      Serial.printf("[PIR] 🔴 Still detecting motion... (%lu s)\n", duration / 1000);
    }
  }
}

// ============================================ 
// DISTANCE MEASUREMENT
// ============================================ 
float measureDistance() {
  #if ULTRASONIC_REAL_MODE
    // Trigger pulse
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    
    // Measure echo
    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    
    if (duration == 0) {
      return 999.0;
    }
    
    float distance = duration / 58.0;
    
    if (distance < 2.0 || distance > 400.0) {
      return 999.0;
    }
    
    return distance;
  #else
    // Simulated distance for testing
    return 75.0;
  #endif
}

void checkDistance(unsigned long currentTime) {
  if (currentTime - lastDistanceCheck < DISTANCE_CHECK_INTERVAL) {
    return;
  }
  lastDistanceCheck = currentTime;
  
  currentDistance = measureDistance();
  distanceMeasurementCount++;
  
  // Detect significant distance changes
  if (abs(currentDistance - lastDistance) > 20 && currentDistance < 400) {
    if (logDistanceChanges) {
      Serial.println("\n╔═══════════════════════════════════════╗");
      Serial.println("║  📏 DISTANCE CHANGED                  ║");
      Serial.println("╚═══════════════════════════════════════╝");
      Serial.printf("   From: %.1f cm → To: %.1f cm\n", lastDistance, currentDistance);
      
      // Classify zone
      if (currentDistance < DISTANCE_VERY_CLOSE) {
        Serial.println("   Zone: 🔴 VERY CLOSE (< 50cm)");
      } else if (currentDistance < DISTANCE_CLOSE) {
        Serial.println("   Zone: 🟠 CLOSE (50-100cm)");
      } else if (currentDistance < DISTANCE_VIEWING) {
        Serial.println("   Zone: 🟡 VIEWING (100-150cm)");
      } else {
        Serial.println("   Zone: 🟢 FAR (> 150cm)");
      }
    }
  }
  
  // User presence logic
  bool wasUserPresent = userPresent;
  
  if (currentDistance < DISTANCE_CLOSE) {
    // User arrived (< 100cm)
    if (!userPresent) {
      userPresent = true;
      sendUserArrived(currentDistance);
    }
  } else if (currentDistance < DISTANCE_VIEWING) {
    // User passing by (100-150cm)
    if (userPresent) {
      sendUserPassed(currentDistance);
    }
    userPresent = false;
  } else {
    // User far away
    userPresent = false;
  }
  
  lastDistance = currentDistance;
}

// ============================================ 
// STATUS REPORTING
// ============================================ 
void printDetailedStatus() {
  unsigned long currentTime = millis();
  unsigned long uptime = currentTime / 1000;
  
  Serial.println("\n");
  Serial.println("╔════════════════════════════════════════════════════════════╗");
  Serial.println("║           USER DETECTION TEST - STATUS REPORT             ║");
  Serial.println("╠════════════════════════════════════════════════════════════╣");
  
  // System info
  Serial.printf("║ Uptime: %lu s (%lu min)                                    \n", uptime, uptime / 60);
  Serial.printf("║ Loop count: %lu                                            \n", loopCount);
  Serial.printf("║ Loop frequency: ~%lu Hz                                    \n", 
                loopCount / (uptime > 0 ? uptime : 1));
  Serial.println("╠════════════════════════════════════════════════════════════╣");
  
  // WebSocket status
  Serial.printf("║ WebSocket: %s                                              \n", 
                isConnected ? "✅ CONNECTED" : "❌ DISCONNECTED");
  if (isConnected) {
    Serial.printf("║ Client ID: %s                                              \n", 
                  clientId.length() > 0 ? clientId.c_str() : "Not assigned");
  }
  Serial.println("╠════════════════════════════════════════════════════════════╣");
  
  // PIR status
  Serial.printf("║ PIR State: %s                                              \n", 
                pirState == HIGH ? "🔴 DETECTING MOTION" : "🟢 NO MOTION");
  Serial.printf("║ Total detections: %lu                                      \n", totalMotionDetections);
  if (pirState == HIGH) {
    unsigned long duration = currentTime - pirHighStartTime;
    Serial.printf("║ Current motion duration: %lu ms                            \n", duration);
  }
  Serial.printf("║ Last motion event sent: %lu ms ago                         \n", 
                currentTime - lastMotionEventSent);
  Serial.println("╠════════════════════════════════════════════════════════════╣");
  
  // Distance status
  Serial.printf("║ Current distance: %.1f cm                                  \n", currentDistance);
  Serial.printf("║ Measurements taken: %lu                                    \n", distanceMeasurementCount);
  Serial.printf("║ User present: %s                                           \n", 
                userPresent ? "✅ YES" : "❌ NO");
  
  if (currentDistance < DISTANCE_VERY_CLOSE) {
    Serial.println("║ Zone: 🔴 VERY CLOSE (< 50cm)                              ");
  } else if (currentDistance < DISTANCE_CLOSE) {
    Serial.println("║ Zone: 🟠 CLOSE (50-100cm)                                 ");
  } else if (currentDistance < DISTANCE_VIEWING) {
    Serial.println("║ Zone: 🟡 VIEWING (100-150cm)                              ");
  } else {
    Serial.println("║ Zone: 🟢 FAR (> 150cm)                                    ");
  }
  
  Serial.printf("║ Last user_arrived sent: %lu ms ago                         \n", 
                currentTime - lastUserArrivedSent);
  Serial.printf("║ Last user_passed sent: %lu ms ago                          \n", 
                currentTime - lastUserPassedSent);
  
  Serial.println("╚════════════════════════════════════════════════════════════╝");
  Serial.println();
}

void printPirStats() {
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║       PIR SENSOR STATISTICS           ║");
  Serial.println("╠════════════════════════════════════════╣");
  Serial.printf("║ Total detections: %lu                  \n", totalMotionDetections);
  Serial.printf("║ Current state: %s                      \n", 
                pirState == HIGH ? "HIGH (motion)" : "LOW (no motion)");
  Serial.printf("║ Last state change: %lu ms ago          \n", 
                millis() - lastPirChangeTime);
  if (pirState == HIGH) {
    Serial.printf("║ Current duration: %lu ms               \n", 
                  millis() - pirHighStartTime);
  } else {
    Serial.printf("║ Last duration: %lu ms                  \n", pirHighDuration);
  }
  Serial.println("╚════════════════════════════════════════╝\n");
}

// ============================================ 
// SERIAL COMMANDS
// ============================================ 
void handleSerialCommands() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();
    
    if (cmd == "STATUS" || cmd == "S") {
      printDetailedStatus();
    }
    else if (cmd == "PIR" || cmd == "P") {
      printPirStats();
    }
    else if (cmd == "VERBOSE ON" || cmd == "V ON") {
      verboseLogging = true;
      Serial.println("✅ Verbose logging ENABLED");
    }
    else if (cmd == "VERBOSE OFF" || cmd == "V OFF") {
      verboseLogging = false;
      Serial.println("✅ Verbose logging DISABLED");
    }
    else if (cmd == "LOGPIR ON") {
      logPirChanges = true;
      Serial.println("✅ PIR change logging ENABLED");
    }
    else if (cmd == "LOGPIR OFF") {
      logPirChanges = false;
      Serial.println("✅ PIR change logging DISABLED");
    }
    else if (cmd == "LOGDIST ON") {
      logDistanceChanges = true;
      Serial.println("✅ Distance change logging ENABLED");
    }
    else if (cmd == "LOGDIST OFF") {
      logDistanceChanges = false;
      Serial.println("✅ Distance change logging DISABLED");
    }
    else if (cmd == "LOGWS ON") {
      logWebSocketEvents = true;
      Serial.println("✅ WebSocket event logging ENABLED");
    }
    else if (cmd == "LOGWS OFF") {
      logWebSocketEvents = false;
      Serial.println("✅ WebSocket event logging DISABLED");
    }
    else if (cmd == "RESET") {
      Serial.println("🔄 Resetting statistics...");
      totalMotionDetections = 0;
      missedMotionCount = 0;
      distanceMeasurementCount = 0;
      loopCount = 0;
      Serial.println("✅ Statistics reset");
    }
    else if (cmd == "HELP" || cmd == "H") {
      Serial.println("\n╔════════════════════════════════════════╗");
      Serial.println("║     SERIAL COMMANDS - HELP            ║");
      Serial.println("╠════════════════════════════════════════╣");
      Serial.println("║ STATUS / S     - Print detailed status");
      Serial.println("║ PIR / P        - Print PIR statistics ");
      Serial.println("║ VERBOSE ON/OFF - Toggle verbose logs  ");
      Serial.println("║ LOGPIR ON/OFF  - Toggle PIR logs      ");
      Serial.println("║ LOGDIST ON/OFF - Toggle distance logs ");
      Serial.println("║ LOGWS ON/OFF   - Toggle WebSocket logs");
      Serial.println("║ RESET          - Reset all statistics ");
      Serial.println("║ HELP / H       - Show this help       ");
      Serial.println("╚════════════════════════════════════════╝\n");
    }
    else if (cmd.length() > 0) {
      Serial.println("❌ Unknown command. Type HELP for available commands.");
    }
  }
}

// ============================================ 
// SETUP
// ============================================ 
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════════════════════════╗");
  Serial.println("║                                                            ║");
  Serial.println("║       USER DETECTION TEST FIRMWARE v1.0                   ║");
  Serial.println("║       High-Quality Debugging & Logging                    ║");
  Serial.println("║                                                            ║");
  Serial.println("╚════════════════════════════════════════════════════════════╝");
  
  // Pin setup
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  digitalWrite(LED_PIN, LOW);
  
  Serial.println("\n[INIT] 🔧 Initializing hardware...");
  Serial.printf("[INIT] 📍 PIR Pin: %d\n", PIR_PIN);
  Serial.printf("[INIT] 📍 Ultrasonic Trig: %d, Echo: %d\n", TRIG_PIN, ECHO_PIN);
  Serial.printf("[INIT] 📍 LED Pin: %d\n", LED_PIN);
  
  #if ULTRASONIC_REAL_MODE
    Serial.println("[INIT] 📏 Ultrasonic: REAL MODE (hardware connected)");
  #else
    Serial.println("[INIT] 📏 Ultrasonic: SIMULATION MODE");
  #endif
  
  // WiFi setup
  Serial.printf("\n[WiFi] 📡 Connecting to: %s\n", ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] ✅ Connected!");
    Serial.printf("[WiFi] 🌐 IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] ❌ Connection FAILED!");
    Serial.println("[WiFi] ⚠️ Continuing without WiFi...");
  }
  
  // WebSocket setup
  Serial.printf("\n[WS] 🔌 Connecting to: %s:%d%s\n", ws_host, ws_port, ws_path);
  webSocket.beginSSL(ws_host, ws_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  // PIR warm-up
  Serial.println("\n[PIR] ⏳ Warming up PIR sensor (30 seconds)...");
  Serial.println("[PIR] 💡 Please remain still during warm-up");
  
  for (int i = 30; i > 0; i--) {
    Serial.printf("[PIR] ⏱️  %d seconds remaining...\n", i);
    delay(1000);
  }
  
  Serial.println("[PIR] ✅ PIR sensor ready!");
  
  // Ready
  Serial.println("\n╔════════════════════════════════════════════════════════════╗");
  Serial.println("║                    SYSTEM READY                            ║");
  Serial.println("╠════════════════════════════════════════════════════════════╣");
  Serial.println("║ Type 'HELP' for available commands                        ║");
  Serial.println("║ Type 'STATUS' for detailed status report                  ║");
  Serial.println("╚════════════════════════════════════════════════════════════╝\n");
  
  lastStatusPrint = millis();
}

// ============================================ 
// MAIN LOOP
// ============================================ 
void loop() {
  unsigned long currentTime = millis();
  loopCount++;
  
  // WebSocket handling
  webSocket.loop();
  
  // Serial commands
  handleSerialCommands();
  
  // PIR monitoring
  checkPirSensor(currentTime);
  
  // Distance monitoring
  checkDistance(currentTime);
  
  // Auto status print every 2 seconds
  if (currentTime - lastStatusPrint >= STATUS_PRINT_INTERVAL) {
    printDetailedStatus();
    lastStatusPrint = currentTime;
  }
  
  // Small delay to prevent overwhelming the serial output
  delay(10);
}
