#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ===========================
// WiFi Configuration
// ===========================
const char* ssid = "YOUR_WIFI_SSID";           // Replace with your WiFi SSID
const char* password = "YOUR_WIFI_PASSWORD";   // Replace with your WiFi password

// ===========================
// WebSocket Configuration
// ===========================
const char* ws_host = "your-backend.onrender.com";  // Replace with your Render backend domain (without https://)
const int ws_port = 443;                             // Use 443 for secure WebSocket (wss://)
const char* ws_path = "/ws";                         // WebSocket endpoint path
const bool use_ssl = true;                           // Set to true for wss://, false for ws://

// ===========================
// Sensor Pin Configuration
// ===========================
const int PIR_PIN = 14;           // PIR motion sensor pin
const int TRIG_PIN = 12;          // Ultrasonic sensor trigger pin
const int ECHO_PIN = 13;          // Ultrasonic sensor echo pin

// ===========================
// Configurable Parameters
// ===========================
// Edit these values to tune behavior without changing code logic.
const unsigned long SENSOR_READ_INTERVAL_MS = 100;   // Sensor loop period
const uint8_t MEDIAN_SAMPLES_PER_BURST = 5;          // Samples per burst for median
const unsigned long BURST_SAMPLE_DELAY_US = 5000;    // Delay between burst samples

const float MIN_DISTANCE_CM = 2.0;                   // Plausible min range
const float MAX_DISTANCE_CM = 300.0;                 // Plausible max range
const float DISTANCE_CHANGE_MIN_CM = 5.0;            // Significant change threshold (for logs only)

const float NEAR_THRESHOLD_CM = 50.0;                // Enter near when distance <= 50 cm
const float NEAR_EXIT_THRESHOLD_CM = 60.0;           // Exit near when distance >= 60 cm (hysteresis)
const float FAR_THRESHOLD_CM = 100.0;                // Mid-range (passed) when 50 < d <= 100

const uint8_t CONFIRMATION_COUNT = 3;                // Consecutive medians required to confirm state

const unsigned long DEBOUNCE_DELAY_MS = 2000;        // Debounce between state changes
const unsigned long NEAR_REARM_AWAY_TIME_MS = 3000;  // Time outside near to allow new ARRIVED

const unsigned long MOTION_VALID_WINDOW_NEAR_MS = 3000;    // PIR must be recent for ARRIVED
const unsigned long MOTION_VALID_WINDOW_PASSED_MS = 5000;  // PIR must be recent for PASSED

// Adaptive fast-path for very close arrivals
const float ADAPTIVE_NEAR_CM = 30.0;                       // If closer than this, allow fast ARRIVED
const unsigned long ADAPTIVE_NEAR_MOTION_WINDOW_MS = 1000; // Motion window for fast ARRIVED
const uint8_t ADAPTIVE_NEAR_CONFIRMATIONS = 1;             // Require only 1 confirmed median when adaptive applies

// Other timing
const unsigned long RECONNECT_INTERVAL = 5000;             // Reconnect attempt interval

// Ping-Pong Health Check Configuration
const unsigned long ESP32_PING_INTERVAL_MS = 30000;        // Send ping every 30s
const unsigned long PING_TIMEOUT_MS = 10000;               // Expect pong within 10s  
const uint8_t MAX_MISSED_PINGS = 2;                        // Reconnect after 2 timeouts

// ===========================
// Global Variables
// ===========================
WebSocketsClient webSocket;
bool isConnected = false;
String clientId = "";

// Sensor state tracking
enum UserState {
  STATE_NONE,       // No user detected
  STATE_PASSED,     // User passed by
  STATE_ARRIVED     // User arrived near tablet
};

UserState currentState = STATE_NONE;
UserState lastSentState = STATE_NONE;
float lastDistance = -1.0;
unsigned long lastDistanceChange = 0;
unsigned long lastStateChange = 0;
bool motionDetected = false;
unsigned long lastMotionTime = 0;

// Near-state rearm tracking: after sending ARRIVED, require leaving near for a while
bool nearLatched = false;                 // true after we send ARRIVED
unsigned long nearExitStartTime = 0;      // when we first read distance >= NEAR_EXIT_THRESHOLD

// Ping-Pong health tracking
unsigned long lastPingSentTime = 0;       // when we last sent ping to backend
unsigned long lastPongReceivedTime = 0;   // when we last received pong from backend
unsigned long lastBackendPingTime = 0;    // when backend last pinged us
uint8_t missedPings = 0;                  // consecutive missed pongs
bool connectionHealthy = true;            // overall connection health status

// ===========================
// WebSocket Event Handler
// ===========================
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected from server");
      isConnected = false;
      clientId = "";
      break;
      
    case WStype_CONNECTED:
      Serial.printf("[WS] Connected to server: %s\n", payload);
      isConnected = true;
      
      // Send identify message to register as ESP32 sensor
      StaticJsonDocument<200> identifyDoc;
      identifyDoc["type"] = "identify";
      identifyDoc["role"] = "esp32_sensor";
      
      String identifyMsg;
      serializeJson(identifyDoc, identifyMsg);
      webSocket.sendTXT(identifyMsg);
      Serial.println("[WS] Sent identification as esp32_sensor");
      break;
      
    case WStype_TEXT:
      Serial.printf("[WS] Received: %s\n", payload);
      handleWebSocketMessage((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.printf("[WS] Error: %s\n", payload);
      break;
      
    case WStype_PING:
      Serial.println("[WS] Received PING");
      break;
      
    case WStype_PONG:
      Serial.println("[WS] Received PONG");
      break;
  }
}


// ===========================
// Send Motion Detection Event
// ===========================
void sendMotionDetected() {
  if (!isConnected) return;
  
  StaticJsonDocument<200> doc;
  doc["type"] = "motion_detected";
  doc["timestamp"] = millis();
  doc["sensor"] = "PIR";
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  
  Serial.println("[SENSOR] Sent: Motion detected");
}

// ===========================
// Send User State Event
// ===========================
void sendUserState(UserState state, float distance) {
  if (!isConnected) return;
  
  StaticJsonDocument<300> doc;
  
  if (state == STATE_PASSED) {
    doc["type"] = "user_passed";
    doc["message"] = "User passed by the tablet";
  } else if (state == STATE_ARRIVED) {
    doc["type"] = "user_arrived";
    doc["message"] = "User arrived near the tablet";
  } else {
    return; // Don't send STATE_NONE
  }
  
  doc["distance"] = distance;
  doc["timestamp"] = millis();
  doc["sensor"] = "ultrasonic";
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  
  Serial.printf("[SENSOR] Sent: %s (distance: %.2f cm)\n", 
                state == STATE_PASSED ? "User passed" : "User arrived", 
                distance);
}

// ===========================
// Read Ultrasonic Sensor
// ===========================
float readUltrasonicDistanceRaw() {
  // Send ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read the echo
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  
  if (duration == 0) {
    return -1.0; // No echo received (out of range)
  }
  
  // Calculate distance in cm
  float distance = duration * 0.034 / 2.0;
  
  return distance;
}

// ===========================
// WebSocket Message Handler
// ===========================
void handleWebSocketMessage(const char* message) {
  // Parse JSON message
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.printf("[ESP32] JSON parse error: %s\n", error.c_str());
    return;
  }
  
  const char* type = doc["type"];
  if (!type) return;
  
  if (strcmp(type, "pong") == 0) {
    // Backend responded to our ping
    lastPongReceivedTime = millis();
    missedPings = 0;
    connectionHealthy = true;
    Serial.println("[ESP32] Received pong from backend - connection healthy");
  } else if (strcmp(type, "ping") == 0) {
    // Backend is pinging us, respond with pong
    lastBackendPingTime = millis();
    sendPong();
    Serial.println("[ESP32] Received ping from backend, sent pong");
  } else if (strcmp(type, "connected") == 0) {
    clientId = doc["clientId"].as<String>();
    Serial.printf("[WS] Assigned Client ID: %s\n", clientId.c_str());
  }
}

// ===========================
// Ping-Pong Functions
// ===========================
void sendPing() {
  if (!isConnected) return;
  
  DynamicJsonDocument doc(256);
  doc["type"] = "ping";
  doc["timestamp"] = millis();
  
  String message;
  serializeJson(doc, message);
  webSocket.sendTXT(message);
  
  lastPingSentTime = millis();
  Serial.println("[ESP32] Sent ping to backend");
}

void sendPong() {
  if (!isConnected) return;
  
  DynamicJsonDocument doc(256);
  doc["type"] = "pong";
  doc["timestamp"] = millis();
  
  String message;
  serializeJson(doc, message);
  webSocket.sendTXT(message);
  
  Serial.println("[ESP32] Sent pong to backend");
}

// ===========================
// Handle Ping-Pong Health Check
// ===========================
void handlePingPong() {
  unsigned long currentTime = millis();
  
  // Send ping to backend every ESP32_PING_INTERVAL_MS
  if (currentTime - lastPingSentTime >= ESP32_PING_INTERVAL_MS) {
    sendPing();
  }
  
  // Check if we've missed too many pongs
  if (lastPingSentTime > 0 && lastPongReceivedTime < lastPingSentTime) {
    // We sent a ping but haven't received pong yet
    if (currentTime - lastPingSentTime >= PING_TIMEOUT_MS) {
      missedPings++;
      Serial.printf("[ESP32] Ping timeout! Missed pings: %d/%d\n", missedPings, MAX_MISSED_PINGS);
      
      if (missedPings >= MAX_MISSED_PINGS) {
        Serial.println("[ESP32] Too many missed pings - connection unhealthy, attempting reconnect");
        connectionHealthy = false;
        isConnected = false;
        webSocket.disconnect();
        // WebSocket will auto-reconnect due to setReconnectInterval
        
        // Reset ping state
        lastPingSentTime = 0;
        lastPongReceivedTime = 0;
        missedPings = 0;
      } else {
        // Reset lastPingSentTime to trigger next ping attempt
        lastPingSentTime = currentTime - ESP32_PING_INTERVAL_MS;
      }
    }
  }
}

// ===========================
// Utility: Burst median reading with plausibility check
// ===========================
float readUltrasonicMedian() {
  float readings[10];
  uint8_t n = MEDIAN_SAMPLES_PER_BURST > 10 ? 10 : MEDIAN_SAMPLES_PER_BURST;
  uint8_t got = 0;
  for (uint8_t i = 0; i < n; i++) {
    float d = readUltrasonicDistanceRaw();
    if (d >= MIN_DISTANCE_CM && d <= MAX_DISTANCE_CM) {
      readings[got++] = d;
    }
    delayMicroseconds(BURST_SAMPLE_DELAY_US);
  }
  if (got == 0) return -1.0;
  // Simple insertion sort for small arrays
  for (uint8_t i = 1; i < got; i++) {
    float key = readings[i];
    int8_t j = i - 1;
    while (j >= 0 && readings[j] > key) {
      readings[j + 1] = readings[j];
      j--;
    }
    readings[j + 1] = key;
  }
  // Median
  if (got % 2 == 1) return readings[got / 2];
  return 0.5 * (readings[got / 2 - 1] + readings[got / 2]);
}

// ===========================
// Process Sensor Data
// ===========================
void processSensorData() {
  static unsigned long lastSensorRead = 0;
  unsigned long currentTime = millis();
  
  // Read sensors at specified interval
  if (currentTime - lastSensorRead < SENSOR_READ_INTERVAL_MS) {
    return;
  }
  lastSensorRead = currentTime;
  
  // === PIR Motion Sensor ===
  int pirState = digitalRead(PIR_PIN);
  if (pirState == HIGH) {
    if (!motionDetected) {
      sendMotionDetected();
    }
    motionDetected = true;
    lastMotionTime = currentTime;
  } else {
    motionDetected = false;
  }
  
  // === Ultrasonic Distance Sensor ===
  float distance = readUltrasonicMedian();
  
  // Skip if reading is invalid
  if (distance < 0) {
    Serial.println("[SENSOR] Skipping invalid ultrasonic reading (no plausible median)");
    return;
  }
  
  // Check if distance has changed significantly (for logs)
  if (lastDistance < 0 || abs(distance - lastDistance) >= DISTANCE_CHANGE_MIN_CM) {
    lastDistanceChange = currentTime;
  }
  
  // Update last distance
  lastDistance = distance;
  
  // Hysteresis and latch logic for NEAR state
  // 1) If we are near-latched (already announced ARRIVED), we do not send ARRIVED again
  //    until we have been outside the near-exit threshold for NEAR_REARM_AWAY_TIME.
  if (nearLatched) {
    if (distance >= NEAR_EXIT_THRESHOLD_CM) {
      // Started being outside near-exit threshold
      if (nearExitStartTime == 0) {
        nearExitStartTime = currentTime;
      }
      // If we have remained away long enough, unlatch
      if (currentTime - nearExitStartTime >= NEAR_REARM_AWAY_TIME_MS) {
        nearLatched = false;
        nearExitStartTime = 0;
      }
    } else {
      // Still near; reset away timer
      nearExitStartTime = 0;
    }
  }

  // Determine new state based on distance with hysteresis
  UserState candidateState = STATE_NONE;
  if (distance <= NEAR_THRESHOLD_CM) {
    candidateState = STATE_ARRIVED;
  } else if (distance > NEAR_THRESHOLD_CM && distance <= FAR_THRESHOLD_CM) {
    candidateState = STATE_PASSED;
  } else {
    candidateState = STATE_NONE;
  }

  // Confirmation counters across cycles
  static uint8_t nearConfirmCount = 0;
  static uint8_t passedConfirmCount = 0;

  if (candidateState == STATE_ARRIVED) {
    passedConfirmCount = 0;
    // PIR gating for near
    bool pirRecent = (currentTime - lastMotionTime) <= MOTION_VALID_WINDOW_NEAR_MS;

    // Adaptive fast path if very close and motion very recent
    uint8_t requiredConfirms = CONFIRMATION_COUNT;
    if (distance <= ADAPTIVE_NEAR_CM && (currentTime - lastMotionTime) <= ADAPTIVE_NEAR_MOTION_WINDOW_MS) {
      requiredConfirms = ADAPTIVE_NEAR_CONFIRMATIONS;
    }

    if (pirRecent) {
      if (nearConfirmCount < 255) nearConfirmCount++;
    } else {
      nearConfirmCount = 0;
    }

    // Debounce state changes and latch check
    if (nearConfirmCount >= requiredConfirms && !nearLatched) {
      if (currentTime - lastStateChange >= DEBOUNCE_DELAY_MS && pirRecent) {
        currentState = STATE_ARRIVED;
        lastStateChange = currentTime;
        sendUserState(STATE_ARRIVED, distance);
        lastSentState = STATE_ARRIVED;
        nearLatched = true;
        Serial.println("[SENSOR] ARRIVED confirmed and sent");
      }
    }
  } else if (candidateState == STATE_PASSED) {
    nearConfirmCount = 0;

    // PIR gating for passed
    bool pirRecent = (currentTime - lastMotionTime) <= MOTION_VALID_WINDOW_PASSED_MS;
    if (pirRecent) {
      if (passedConfirmCount < 255) passedConfirmCount++;
    } else {
      passedConfirmCount = 0;
    }

    if (passedConfirmCount >= CONFIRMATION_COUNT) {
      if (currentTime - lastStateChange >= DEBOUNCE_DELAY_MS) {
        currentState = STATE_PASSED;
        lastStateChange = currentTime;
        if (lastSentState != STATE_PASSED) {
          sendUserState(STATE_PASSED, distance);
          lastSentState = STATE_PASSED;
          Serial.println("[SENSOR] PASSED confirmed and sent");
        }
      }
    }
  } else {
    // None: reset confirmation counters
    nearConfirmCount = 0;
    passedConfirmCount = 0;
  }
  
  // Debug output
  Serial.printf("[SENSOR] Distance: %.2f cm | State: %s\n", 
                distance, 
                currentState == STATE_ARRIVED ? "ARRIVED" : 
                currentState == STATE_PASSED ? "PASSED" : "NONE");
}

// ===========================
// Setup
// ===========================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("ESP32 Sensor WebSocket Client");
  Serial.println("=================================\n");
  
  // Configure sensor pins
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  Serial.println("[SETUP] Sensor pins configured");
  
  // Connect to WiFi
  Serial.printf("[WiFi] Connecting to %s", ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.printf("[WiFi] IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] Signal Strength: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n[WiFi] Connection failed!");
    return;
  }
  
  // Configure WebSocket
  if (use_ssl) {
    webSocket.beginSSL(ws_host, ws_port, ws_path);
    Serial.printf("[WS] Connecting to wss://%s:%d%s\n", ws_host, ws_port, ws_path);
  } else {
    webSocket.begin(ws_host, ws_port, ws_path);
    Serial.printf("[WS] Connecting to ws://%s:%d%s\n", ws_host, ws_port, ws_path);
  }
  
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(RECONNECT_INTERVAL);
  webSocket.enableHeartbeat(15000, 3000, 2); // Ping every 15s, timeout 3s, 2 retries
  
  Serial.println("[SETUP] Complete! Starting main loop...\n");
}

// ===========================
// Main Loop
// ===========================
void loop() {
  // Maintain WebSocket connection
  webSocket.loop();
  
  // Process sensor data if connected
  if (isConnected) {
    processSensorData();
    handlePingPong();
  }
  
  // Check WiFi connection
  static unsigned long lastWiFiCheck = 0;
  if (millis() - lastWiFiCheck > 10000) { // Check every 10 seconds
    lastWiFiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Connection lost! Reconnecting...");
      WiFi.reconnect();
    }
  }
  
  delay(10); // Small delay to prevent watchdog issues
}
