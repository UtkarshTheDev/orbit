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
// Distance Thresholds (in cm)
// ===========================
const float NEAR_THRESHOLD = 50.0;      // Distance considered "near" (user arrived)
const float FAR_THRESHOLD = 100.0;      // Distance considered "far" (user passed)
const float DISTANCE_CHANGE_MIN = 5.0;  // Minimum distance change to consider as significant

// ===========================
// Timing Configuration
// ===========================
const unsigned long SENSOR_READ_INTERVAL = 100;    // Read sensors every 100ms
const unsigned long DEBOUNCE_DELAY = 2000;         // 2 second debounce for state changes
const unsigned long RECONNECT_INTERVAL = 5000;     // Reconnect attempt interval

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
      handleWebSocketMessage(payload, length);
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
// Handle WebSocket Messages
// ===========================
void handleWebSocketMessage(uint8_t * payload, size_t length) {
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (error) {
    Serial.print("[WS] JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }
  
  const char* type = doc["type"];
  
  if (strcmp(type, "connected") == 0) {
    clientId = doc["clientId"].as<String>();
    Serial.printf("[WS] Assigned Client ID: %s\n", clientId.c_str());
  }
  
  // Handle other message types if needed
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
float readUltrasonicDistance() {
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
  
  // Filter out unrealistic values
  if (distance < 2.0 || distance > 400.0) {
    return -1.0;
  }
  
  return distance;
}

// ===========================
// Process Sensor Data
// ===========================
void processSensorData() {
  static unsigned long lastSensorRead = 0;
  unsigned long currentTime = millis();
  
  // Read sensors at specified interval
  if (currentTime - lastSensorRead < SENSOR_READ_INTERVAL) {
    return;
  }
  lastSensorRead = currentTime;
  
  // === PIR Motion Sensor ===
  int pirState = digitalRead(PIR_PIN);
  if (pirState == HIGH && !motionDetected) {
    motionDetected = true;
    lastMotionTime = currentTime;
    sendMotionDetected();
  } else if (pirState == LOW && motionDetected) {
    motionDetected = false;
  }
  
  // === Ultrasonic Distance Sensor ===
  float distance = readUltrasonicDistance();
  
  // Skip if reading is invalid
  if (distance < 0) {
    return;
  }
  
  // Check if distance has changed significantly
  bool significantChange = false;
  if (lastDistance < 0 || abs(distance - lastDistance) >= DISTANCE_CHANGE_MIN) {
    significantChange = true;
    lastDistanceChange = currentTime;
  }
  
  // Update last distance
  lastDistance = distance;
  
  // Only process state changes if distance changed significantly
  if (!significantChange) {
    return;
  }
  
  // Determine new state based on distance
  UserState newState = STATE_NONE;
  
  if (distance <= NEAR_THRESHOLD) {
    newState = STATE_ARRIVED;
  } else if (distance > NEAR_THRESHOLD && distance <= FAR_THRESHOLD) {
    // In the middle zone, keep current state or mark as passed
    if (currentState == STATE_ARRIVED) {
      newState = STATE_PASSED;
    } else {
      newState = STATE_PASSED;
    }
  } else {
    // Too far, no user detected
    newState = STATE_NONE;
  }
  
  // Debounce state changes
  if (newState != currentState) {
    if (currentTime - lastStateChange >= DEBOUNCE_DELAY) {
      // State has changed and debounce period passed
      currentState = newState;
      lastStateChange = currentTime;
      
      // Send event only if it's different from last sent state
      if (newState != lastSentState && newState != STATE_NONE) {
        sendUserState(newState, distance);
        lastSentState = newState;
      }
    }
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
