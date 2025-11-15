// PHASE 3 - PIR + Ultrasonic Distance + Tilt + Random Head
// FINAL WORKING VERSION - All Compilation Issues Fixed
//
// Logic:
// - PIR detects motion
// - Ultrasonic confirms distance
// - Tilt tablet only if person within viewing range
// - Head scans randomly when idle
// - Dual tilt servos with opposite mounting support
//
// WebSocket implementation updated for stability, using WebSocketsClient library.

#include <ESP32Servo.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ============================================
// POWER & GROUND CONFIGURATION NOTES
// ============================================
// For best electrical stability with multiple servos:
// 1.  **Common Ground:** Ensure the ESP32, servos, and the 5V 5A power supply
//     all share a single, common ground connection.
// 2.  **Stable Power:** Power the servos directly from the 5V 5A supply, NOT
//     from the ESP32's 5V pin, which cannot handle the high current draw.
// 3.  **Decoupling Capacitors:** Place a large electrolytic capacitor (e.g., 470µF to 1000µF)
//     across the main 5V and GND power rails, as close to the servos as possible.
//     This capacitor acts as a small reservoir, smoothing out voltage dips that
//     occur when the servos start moving.
// ============================================

// ============================================
// WiFi & WebSocket Configuration
// ============================================
const char* ssid = "Computerlabjio";         // Replace with your WiFi SSID
const char* password = "pass@0009"; // Replace with your WiFi password

const char* ws_host = "orbit-5awh.onrender.com"; // Replace with your Render backend domain
const int ws_port = 443;                           // Use 443 for secure WebSocket (wss://)
const char* ws_path = "/ws";                       // WebSocket endpoint path

// ============================================
// ULTRASONIC MODE CONFIGURATION
// ============================================
// Set to 'true' if you have voltage divider installed
// Set to 'false' to use simulated distance (for testing without resistors)
#define ULTRASONIC_REAL_MODE true  // CHANGE TO false IF NO RESISTORS

// ============================================
// PIN DEFINITIONS
// ============================================
#define PIR_PIN 14
#define TILT_LEFT_PIN 19
#define TILT_RIGHT_PIN 21
#define HEAD_PIN 23
#define LED_PIN 2

// Ultrasonic pins
#define TRIG_PIN 13
#define ECHO_PIN 18

// ============================================
// SERVO ANGLE DEFINITIONS
// ============================================
// Tilt servo angles
#define TILT_MIN 60
#define TILT_MAX 120
#define TILT_NEUTRAL 90
#define TILT_SALUTE 60        // Tilt down to "salute" or "nod"

// Head servo angles
#define HEAD_MIN 30
#define HEAD_MAX 150
#define HEAD_NEUTRAL 90

// Distance thresholds (cm)
#define DISTANCE_VERY_CLOSE 50    // < 50cm: Max tilt
#define DISTANCE_CLOSE 100        // 50-100cm: Medium tilt
#define DISTANCE_VIEWING 500      // 100-500cm: Slight tilt
#define DISTANCE_FAR 500          // > 500cm: Return to neutral

// Distance zone tilt angles - adjusted for opposite servo mounting
#define TILT_VERY_CLOSE 115   // Lean back more when very close (reduced for dual servo stability)
#define TILT_CLOSE 100        // Standard viewing angle (reduced for dual servo stability)
#define TILT_VIEWING 95       // Slight tilt
#define TILT_FAR TILT_NEUTRAL // Neutral when far

// Hysteresis (prevent oscillation)
#define DISTANCE_HYSTERESIS 10  // cm buffer zone
#define DISTANCE_DEPARTURE_THRESHOLD 30 // cm increase to detect departure

// Median filter buffer - increased for better noise rejection
#define MEDIAN_SAMPLES 7  // Use 7 samples for better outlier rejection

// Outlier rejection threshold
#define OUTLIER_THRESHOLD 50.0  // Reject readings that differ by more than 50cm from median

// PIR detection configuration
#define PIR_READ_INTERVAL 50        // Read PIR every 50ms (20Hz)
#define PIR_DEBOUNCE_MS 100         // Debounce PIR for 100ms

// ============================================
// SERVO MANAGEMENT
// ============================================
// Struct to manage servo state and provide a consistent interface
struct ServoMotion {
  Servo servo;
  int currentAngle;
  bool invert = false;

  void attach(int pin) {
    servo.attach(pin);
  }

  void write(int angle) {
    int physicalAngle = invert ? (180 - angle) : angle;
    physicalAngle = constrain(physicalAngle, 0, 180);
    servo.write(physicalAngle);
  }

  void detach() {
    servo.detach();
  }
};

// ============================================
// SERVO OBJECTS
// ============================================
ServoMotion tiltLeft;
ServoMotion tiltRight;
ServoMotion headServo;

// ============================================
// WEBSOCKET & NETWORKING GLOBALS
// ============================================
WebSocketsClient webSocket;
bool isConnected = false;
String clientId = "";

// WebSocket user state tracking
enum WsUserState
{
  WS_STATE_NONE,
  WS_STATE_PASSED,
  WS_STATE_ARRIVED,
  WS_STATE_LEAVED
};
WsUserState lastSentWsState = WS_STATE_NONE;

// ============================================
// GLOBAL VARIABLES
// ============================================

// Current positions
int currentTiltAngle = TILT_NEUTRAL;
// headServo.currentAngle is used for head position

// Runtime-adjustable head limits and behavior
int headMinAngle = HEAD_MIN;
int headMaxAngle = HEAD_MAX;
bool headScanEnabled = true;
int headStepDeg = 2;
unsigned long headStepDelayMs = 5; // Further reduced for faster head movement
int headRandomStepMinDeg = 15;
int headRandomStepMaxDeg = 45;

// System states
enum SystemState {
  IDLE,
  MOTION_DETECTED,
  MEASURING_DISTANCE,
  VIEWING_CLOSE,
  VIEWING_MEDIUM,
  VIEWING_FAR,
  USER_DEPARTING,
  RETURNING_NEUTRAL
};

SystemState currentState = IDLE;
SystemState previousState = IDLE;

// Timing variables
unsigned long lastPIRTrigger = 0;
unsigned long lastPIRReadTime = 0;
unsigned long lastPirChangeTime = 0;
unsigned long lastDistanceCheck = 0;
unsigned long lastHeadMoveTime = 0;
unsigned long nextHeadMoveTime = 0;

const unsigned long PIR_TIMEOUT = 3000;
const unsigned long DISTANCE_CHECK_INTERVAL = 200;  // Reduced to 200ms for faster response
const unsigned long HEAD_MOVE_INTERVAL_MIN = 6000;
const unsigned long HEAD_MOVE_INTERVAL_MAX = 15000;

// PIR state tracking
int pirState = LOW;
int lastPirState = LOW;
unsigned long pirHighStartTime = 0;
unsigned long totalMotionDetections = 0;

// Distance measurement
float currentDistance = 999.0;
float lastStableDistance = 999.0;
float lastValidDistance = 999.0;  // Last known good distance reading

unsigned long lastStateChangeTime = 0;
const unsigned long STATE_CHANGE_DEBOUNCE = 2000;
bool hasLoggedIdle = false;

unsigned long lastDistanceLogTime = 0;
const unsigned long DISTANCE_LOG_INTERVAL = 500;

// Median filter buffer
float distanceBuffer[MEDIAN_SAMPLES];
int bufferIndex = 0;
bool bufferFilled = false;  // Track if buffer has enough samples

// ============================================
// FUNCTION DECLARATIONS
// ============================================
void handleSerialCommands();
void printStatus();
void calibrateHeadPosition();
void rampMoveTilt(int targetAngle);
void setupTiltServos();
void setupHeadServo();
void moveHeadSmooth(int targetAngle);
void loopPIR(unsigned long currentTime);
void loopDistanceMeasurement(unsigned long currentTime);
void loopTiltControl(unsigned long currentTime);
void loopRandomHead(unsigned long currentTime);
float measureDistanceReal();
float measureDistanceSimulated(unsigned long currentTime);
float getMedianDistance();
void handleWebSocketMessage(const char *message);
void performSalute();

// ============================================
// WEBSOCKET FUNCTIONS
// ============================================

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WSc] Disconnected!");
      isConnected = false;
      clientId = "";
      break;
    case WStype_CONNECTED:
      Serial.printf("[WSc] Connected to url: %s\n", payload);
      isConnected = true;
      // Send identify message
      {
        StaticJsonDocument<200> identifyDoc;
        identifyDoc["type"] = "identify";
        identifyDoc["role"] = "esp32_sensor";
        String identifyMsg;
        serializeJson(identifyDoc, identifyMsg);
        webSocket.sendTXT(identifyMsg);
        Serial.println("[WS] Sent identification as esp32_sensor");
      }
      break;
    case WStype_TEXT:
      Serial.printf("[WSc] Received: %s\n", payload);
      handleWebSocketMessage((const char*)payload);
      break;
    case WStype_ERROR:
      Serial.println("[WSc] Error");
      break;
    case WStype_PING:
      Serial.println("[WSc] Got ping");
      break;
    case WStype_PONG:
      Serial.println("[WSc] Got pong");
      break;
  }
}

void handleWebSocketMessage(const char *message)
{
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);

  if (error)
  {
    Serial.printf("[WS] JSON parse error: %s\n", error.c_str());
    return;
  }

  const char *type = doc["type"];
  if (!type)
    return;

  // NOTE: Ping/pong is now handled automatically by the library.
  // The manual 'pong' check is no longer needed.

  if (strcmp(type, "connected") == 0)
  {
    clientId = doc["clientId"].as<String>();
    Serial.printf("[WS] Assigned Client ID: %s\n", clientId.c_str());
  }
}

void sendMotionDetected()
{
  if (!isConnected)
    return;
  StaticJsonDocument<200> doc;
  doc["type"] = "motion_detected";
  doc["timestamp"] = millis();
  doc["sensor"] = "PIR";
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  Serial.println("[WS] Sent: Motion detected");
}

void sendWsUserState(WsUserState state, float distance)
{
  if (!isConnected)
    return;

  StaticJsonDocument<300> doc;
  if (state == WS_STATE_PASSED)
  {
    doc["type"] = "user_passed";
    doc["message"] = "User passed by the tablet";
  }
  else if (state == WS_STATE_ARRIVED)
  {
    doc["type"] = "user_arrived";
    doc["message"] = "User arrived near the tablet";
  }
  else if (state == WS_STATE_LEAVED)
  {
    doc["type"] = "user_leaved";
    doc["message"] = "User leaved the tablet";
  }
  else
  {
    return; // Don't send NONE
  }

  doc["distance"] = distance;
  doc["timestamp"] = millis();
  doc["sensor"] = "ultrasonic";
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  Serial.printf("[WS] Sent: %s (distance: %.2f cm)\n",
                state == WS_STATE_PASSED ? "User passed" : "User arrived",
                distance);
}

// ============================================
// TILT SERVO FUNCTIONS
// ============================================

/*
 * Moves the dual-servo tilt mechanism smoothly to a target angle.
 * This function implements several strategies to handle the mechanical load:
 *
 * 1.  **PWM Position Ramping:** Instead of commanding the final angle directly, it moves
 *     in small increments (e.g., 1 degree) with a delay between each step. This prevents
 *     sudden torque spikes, reducing the risk of the servos stalling or drawing
 *     excessive current, which is critical for the off-center load.
 *
 * 2.  **Synchronized Movement & Load Sharing:** Both tilt servos receive the same logical
 *     angle commands, ensuring they move in tandem. This mechanically couples them to
 *     share the tilt load evenly, preventing one servo from being overloaded.
 *
 * 3.  **Command Staggering:** A small delay (a few milliseconds) is introduced between
 *     commanding the left and right servos within each step. This slightly offsets
 *     their peak current draw, creating a smoother overall power demand on the 5V
 *     supply and reducing the chance of voltage dips that could reset the ESP32.
 *
 * 4.  **Stall Detection (Conceptual):** True stall detection requires current sensing or
 *     position feedback, which these servos lack. A software-based approach could
 *     estimate if a move is taking too long. If millis() - startTime > expectedDuration,
 *     it could pause and retry. However, the primary goal of this ramping function
 *     is to prevent stalls from happening in the first place.
 */
void rampMoveTilt(int targetAngle) {
  targetAngle = constrain(targetAngle, TILT_MIN, TILT_MAX);

  if (targetAngle == currentTiltAngle) {
    return;
  }

  Serial.print("Tilt: ");
  Serial.print(currentTiltAngle);
  Serial.print("° → ");
  Serial.print(targetAngle);
  Serial.println("°");

  int step = (targetAngle > currentTiltAngle) ? 1 : -1;
  int rampDelayMs = 40; // Delay between each degree of movement (30-50ms is good)
  int staggerDelayMs = 5; // Delay between commanding each servo (a few ms)

  for (int angle = currentTiltAngle; angle != targetAngle; angle += step) {
    // Command the first servo
    tiltLeft.write(angle);
    // Stagger the command to the second servo
    delay(staggerDelayMs);
    // Command the second servo
    tiltRight.write(angle);
    // Wait for the step to complete
    delay(rampDelayMs);
  }

  // Ensure final position is set accurately for both
  tiltLeft.write(targetAngle);
  delay(staggerDelayMs);
  tiltRight.write(targetAngle);

  currentTiltAngle = targetAngle;
  delay(100); // Small delay for servos to settle
}

void setupTiltServos() {
  // Configure servo properties based on physical mounting
  tiltLeft.invert = false;   // Set to true if left tilt servo mounted opposite
  tiltRight.invert = true;  // Set to true if right tilt servo mounted opposite

  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);

  tiltLeft.write(TILT_NEUTRAL);
  tiltRight.write(TILT_NEUTRAL);
  currentTiltAngle = TILT_NEUTRAL;

  delay(500);

  // Servos are intentionally left attached to provide holding torque against the load.
}

// Perform a "salute" nod when motion is first detected
void performSalute() {
  Serial.println("Performing salute nod...");
  rampMoveTilt(TILT_SALUTE);
  delay(1500); // Wait 1.5 seconds
  rampMoveTilt(TILT_NEUTRAL);
  Serial.println("Salute complete.");
}

// ============================================
// HEAD SERVO FUNCTIONS
// ============================================

void setupHeadServo() {
  Serial.println("Initializing head servo...");

  headServo.invert = false; // Set to true if head servo is mounted inverted
  headServo.attach(HEAD_PIN);

  // Multi-step initialization for precise positioning
  for (int i = 0; i < 3; i++) {
    headServo.write(HEAD_NEUTRAL);
    delay(200);
  }

  headServo.currentAngle = HEAD_NEUTRAL;
  delay(500);
  // Servo is intentionally left attached to provide holding torque.

  Serial.print("Head servo initialized at: ");
  Serial.print(HEAD_NEUTRAL);
  Serial.println("°");
}

// Precise servo positioning, keeping servo powered to hold position
void moveHeadSmooth(int targetAngle) {
  // Enforce front viewing arc only
  targetAngle = constrain(targetAngle, headMinAngle, headMaxAngle);

  // If already at target, do nothing.
  if (targetAngle == headServo.currentAngle) {
    return;
  }

  Serial.print("Head: ");
  Serial.print(headServo.currentAngle);
  Serial.print("° → ");
  Serial.print(targetAngle);
  Serial.println("°");

  // Servo is now continuously attached, so no attach/detach calls are needed here.

  // CRITICAL: Always start from current known position
  headServo.write(headServo.currentAngle);
  delay(50);

  // Calculate movement direction and distance
  int distance = abs(targetAngle - headServo.currentAngle);
  int direction = (targetAngle > headServo.currentAngle) ? 1 : -1;

  // Use smaller steps for better control
  int stepSize = min(abs(headStepDeg), 2);
  if (stepSize < 1) stepSize = 1;

  // Move step by step
  int currentPos = headServo.currentAngle;
  while (abs(targetAngle - currentPos) > 0) {
    if (abs(targetAngle - currentPos) < stepSize) {
      // Final step - go directly to target
      currentPos = targetAngle;
    } else {
      currentPos += direction * stepSize;
    }

    headServo.write(currentPos);
    delay(headStepDelayMs);
  }

  // CRITICAL: Final position setting with multiple attempts
  headServo.write(targetAngle);
  delay(100);
  headServo.write(targetAngle);
  delay(100);
  headServo.write(targetAngle);

  // Update tracked position
  headServo.currentAngle = targetAngle;

  delay(100);
  // Servo is left attached to hold position against a load.

  Serial.print("Head: Movement complete, now at ");
  Serial.print(headServo.currentAngle);
  Serial.println("°");
}

// ADDED: Calibration function to reset head to known position
void calibrateHeadPosition() {
  Serial.println("=== HEAD CALIBRATION ===");

  headServo.attach(HEAD_PIN);

  // Move to center position multiple times
  for (int i = 0; i < 3; i++) {
    headServo.write(HEAD_NEUTRAL);
    delay(200);
  }

  // Set tracked position
  headServo.currentAngle = HEAD_NEUTRAL;

  delay(500);
  headServo.detach();

  Serial.print("Head calibrated to neutral: ");
  Serial.print(HEAD_NEUTRAL);
  Serial.println("°");
}

// ============================================
// MAIN SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n╔════════════════════════════════════════════╗");
  Serial.println("║  PHASE 4: Integrated Robot Controller     ║");
  Serial.println("╚════════════════════════════════════════════╝");

  #if ULTRASONIC_REAL_MODE
    Serial.println("MODE: REAL Ultrasonic (Hardware connected)");
  #else
    Serial.println("MODE: SIMULATION (No resistors - using fake distance)");
    Serial.println("WARNING: Do NOT connect HC-SR04 ECHO without voltage divider!");
  #endif

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Print quick serial help
  Serial.println("\nSerial commands (type HELP for full list):");
  Serial.println("TILT: T <deg>, TL <deg>, TR <deg>, TINVERTL/R <on|off>");
  Serial.println("HEAD: H <deg>, N, CAL, S <on|off>");

  // Initialize distance buffer
  for (int i = 0; i < MEDIAN_SAMPLES; i++) {
    distanceBuffer[i] = 999.0;
  }
  bufferFilled = false;
  lastValidDistance = 999.0;

  // Initialize PIR state
  pirState = LOW;
  lastPirState = LOW;
  totalMotionDetections = 0;

  setupTiltServos();
  setupHeadServo();

  Serial.println("\n✓ System initialized");
  Serial.println("✓ Tilt at neutral (90°)");
  Serial.println("✓ Head at neutral (90°)");
  Serial.println("\nDistance Zones:");
  Serial.println("  < 50cm   = Very Close (tilt 115°)");
  Serial.println("  50-100cm = Close (tilt 100°)");
  Serial.println("  100-500cm = Viewing (tilt 95°)");
  Serial.println("  > 500cm  = Far (neutral 90°)");

  // --- WiFi & WebSocket Setup ---
  Serial.printf("\n[WiFi] Connecting to %s", ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30)
  {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
   Serial.println("\n[WiFi] Connected!");
   Serial.printf("[WiFi] IP Address: %s\n", WiFi.localIP().toString().c_str());
  } else {
   Serial.println("\n[WiFi] Connection failed!");
   return; // Halt setup if WiFi fails
  }

  // Setup WebSocket callbacks
  Serial.printf("[WS] Connecting to %s:%d%s\n", ws_host, ws_port, ws_path);
  webSocket.beginSSL(ws_host, ws_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000); // try to reconnect every 5s

  Serial.println("\nState: IDLE - Waiting for motion\n");

  nextHeadMoveTime = millis() + random(HEAD_MOVE_INTERVAL_MIN, HEAD_MOVE_INTERVAL_MAX);
}

// ============================================
// MAIN LOOP
// ============================================
void loop() {
  unsigned long currentTime = millis();

  webSocket.loop();

  // Handle serial commands for testing
  handleSerialCommands();

  // Core logic loops
  loopPIR(currentTime);
  loopDistanceMeasurement(currentTime);
  loopTiltControl(currentTime);
  loopRandomHead(currentTime);

  delay(10);
}

// ============================================
// PIR DETECTION - IMPROVED VERSION
// ============================================
void loopPIR(unsigned long currentTime) {
  // Read PIR at fixed intervals for consistent polling
  if (currentTime - lastPIRReadTime < PIR_READ_INTERVAL) {
    return;
  }
  lastPIRReadTime = currentTime;

  // Read current PIR state
  pirState = digitalRead(PIR_PIN);

  // Detect state changes with debouncing
  if (pirState != lastPirState) {
    // Debounce: ensure state is stable
    if (currentTime - lastPirChangeTime > PIR_DEBOUNCE_MS) {

      if (pirState == HIGH) {
        // Motion detected
        lastPIRTrigger = currentTime;
        pirHighStartTime = currentTime;
        totalMotionDetections++;
        digitalWrite(LED_PIN, HIGH);

        // Only trigger state change and salute if coming from IDLE
        if (currentState == IDLE) {
          Serial.println("\n━━━ MOTION DETECTED ━━━");
          Serial.printf("Detection #%lu\n", totalMotionDetections);
          currentState = MOTION_DETECTED;
          sendMotionDetected(); // Send WebSocket message
          // Reset head to neutral on motion detection
          moveHeadSmooth(HEAD_NEUTRAL);
          // Perform salute on first detection
          performSalute();

          // If PIR detects motion and no WS state has been sent yet, consider it a 'user_passed' event.
          if (lastSentWsState == WS_STATE_NONE) {
            sendWsUserState(WS_STATE_PASSED, lastStableDistance); // Use current distance, could be 999.0
            lastSentWsState = WS_STATE_PASSED;
          }
        } else {
          // Update trigger time even if not in IDLE state
          Serial.println("━━━ MOTION CONTINUED ━━━");
          sendMotionDetected(); // Still send WebSocket event
        }

      } else {
        // Motion ended
        unsigned long pirDuration = currentTime - pirHighStartTime;
        digitalWrite(LED_PIN, LOW);
        Serial.printf("━━━ MOTION ENDED (duration: %lu ms) ━━━\n", pirDuration);
      }

      lastPirChangeTime = currentTime;
      lastPirState = pirState;
    }
  } else {
    // Update lastPIRTrigger while motion is continuous
    if (pirState == HIGH) {
      lastPIRTrigger = currentTime;
    }
  }

  // If no motion for PIR_TIMEOUT, consider returning to idle
  if ((currentTime - lastPIRTrigger) > PIR_TIMEOUT) {
    if (currentState != IDLE && currentState != RETURNING_NEUTRAL) {
      // Will be handled by distance check
    }
  }

  // Check for stuck PIR sensor
  if (pirState == HIGH && (currentTime - pirHighStartTime) > 60000) {
    Serial.println("WARNING: PIR sensor has been HIGH for over 60 seconds. Check for hardware issues.");
    pirHighStartTime = currentTime; // Reset timer to avoid spamming
  }
}

// ============================================
// DISTANCE MEASUREMENT
// ============================================
void loopDistanceMeasurement(unsigned long currentTime) {

  // Always measure distance to allow for presence detection without PIR.
  // The state machine in loopTiltControl will handle transitions from IDLE.

  // Check distance at regular intervals
  if ((currentTime - lastDistanceCheck) >= DISTANCE_CHECK_INTERVAL) {
    lastDistanceCheck = currentTime;

    #if ULTRASONIC_REAL_MODE
      currentDistance = measureDistanceReal();
    #else
      currentDistance = measureDistanceSimulated(currentTime);
    #endif

    // Add to median filter
    distanceBuffer[bufferIndex] = currentDistance;
    bufferIndex = (bufferIndex + 1) % MEDIAN_SAMPLES;

    // Mark buffer as filled after first complete cycle
    if (bufferIndex == 0 && !bufferFilled) {
      bufferFilled = true;
      Serial.println("✓ Distance buffer filled - outlier rejection active");
    }

    // Get filtered distance with outlier rejection
    float filteredDistance = getMedianDistance();

    // Update stable distance with hysteresis
    if (abs(filteredDistance - lastStableDistance) > DISTANCE_HYSTERESIS) {
      lastStableDistance = filteredDistance;

      // Throttled logging
      bool shouldLog = false;

      if ((currentTime - lastDistanceLogTime) >= DISTANCE_LOG_INTERVAL) {
        shouldLog = true;
      }

      // Or if distance changed significantly
      static float lastPrintedDistance = 999.0;
      if (abs(filteredDistance - lastPrintedDistance) > 30) {
        shouldLog = true;
      }

      if (shouldLog) {
        lastDistanceLogTime = currentTime;
        lastPrintedDistance = filteredDistance;

        Serial.print("Distance: ");
        Serial.print(filteredDistance, 1);
        Serial.print(" cm");

        // Determine zone
        if (filteredDistance < DISTANCE_VERY_CLOSE) {
          Serial.println(" [VERY CLOSE]");
        } else if (filteredDistance < DISTANCE_CLOSE) {
          Serial.println(" [CLOSE]");
        } else if (filteredDistance < DISTANCE_VIEWING) {
          Serial.println(" [VIEWING]");
        } else {
          Serial.println(" [FAR]");
        }
      }
    }
  }
}

// Real ultrasonic measurement
float measureDistanceReal() {
  // Trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo pulse (timeout 30ms = ~5m max range)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    return 999.0;  // No echo received
  }

  // Calculate distance: duration (µs) / 58 = distance (cm)
  float distance = duration / 58.0;

  // Sanity check (HC-SR04 range: 2cm - 400cm)
  if (distance < 2.0 || distance > 400.0) {
    return 999.0;
  }

  return distance;
}

// Simulated distance (for testing without hardware)
float measureDistanceSimulated(unsigned long currentTime) {
  // Simulate person approaching and leaving
  static unsigned long simStartTime = 0;
  static bool simApproaching = true;

  if (currentState == MOTION_DETECTED && simStartTime == 0) {
    simStartTime = currentTime;
    simApproaching = true;
  }

  if (simStartTime == 0) {
    return 999.0;  // No person
  }

  unsigned long elapsed = currentTime - simStartTime;
  float simDistance;

  if (simApproaching) {
    // Simulate approaching: 300cm → 50cm over 10 seconds
    simDistance = 300.0 - (elapsed / 40.0);

    if (simDistance < 50.0) {
      simDistance = 50.0;
      simApproaching = false;
      simStartTime = currentTime;
    }
  } else {
    // Simulate leaving: 50cm → 300cm over 10 seconds
    simDistance = 50.0 + (elapsed / 40.0);

    if (simDistance > 300.0) {
      simDistance = 999.0;
      simStartTime = 0;
    }
  }

  return simDistance;
}

// Advanced median filter with outlier rejection
float getMedianDistance() {
  float sorted[MEDIAN_SAMPLES];
  memcpy(sorted, distanceBuffer, sizeof(distanceBuffer));

  // Simple bubble sort
  for (int i = 0; i < MEDIAN_SAMPLES - 1; i++) {
    for (int j = 0; j < MEDIAN_SAMPLES - i - 1; j++) {
      if (sorted[j] > sorted[j + 1]) {
        float temp = sorted[j];
        sorted[j] = sorted[j + 1];
        sorted[j + 1] = temp;
      }
    }
  }

  float median = sorted[MEDIAN_SAMPLES / 2];  // Get middle value

  // Only reject 999.0 cm readings (sensor timeout/no echo)
  // All other readings are valid (person movement is real)
  if (median >= 999.0) {
    // Bad reading from sensor, use last valid distance if available
    if (lastValidDistance < 900.0) {
      return lastValidDistance;
    }
    return 999.0;
  }

  // Valid reading - update and return
  lastValidDistance = median;
  return median;
}

// ============================================
// TILT CONTROL BASED ON DISTANCE
// ============================================
void loopTiltControl(unsigned long currentTime) {
  int targetTiltAngle = TILT_NEUTRAL;
  SystemState newState = currentState;

  // If IDLE, check for presence using ultrasonic sensor as a primary trigger
  if (currentState == IDLE && lastStableDistance < DISTANCE_VIEWING) {
    // A person is detected if distance is valid and within viewing range
    Serial.println("\n━━━ ULTRASONIC PRESENCE DETECTED ━━━");
    currentState = MOTION_DETECTED; // Mimic PIR trigger to enter the active flow
                                    // This avoids the salute/head-snap but engages tilt
  }

  // Determine target angle based on distance
  if (lastStableDistance < DISTANCE_VERY_CLOSE) {
    targetTiltAngle = TILT_VERY_CLOSE;
    newState = VIEWING_CLOSE;
  }
  else if (lastStableDistance < DISTANCE_CLOSE) {
    targetTiltAngle = TILT_CLOSE;
    newState = VIEWING_MEDIUM;
  }
  else if (lastStableDistance < DISTANCE_VIEWING) {
    targetTiltAngle = TILT_VIEWING;
    newState = VIEWING_FAR;
  }
  else {
    // Far or no person
    targetTiltAngle = TILT_NEUTRAL;

    bool wasViewing = (currentState == VIEWING_CLOSE || currentState == VIEWING_MEDIUM || currentState == VIEWING_FAR);

    // If user was being viewed and now they are far away, they are either departing or have left.
    if (wasViewing) {
      if (lastStableDistance > lastValidDistance + DISTANCE_DEPARTURE_THRESHOLD) {
        newState = USER_DEPARTING; // User left quickly
      } else {
        newState = RETURNING_NEUTRAL; // User moved away slowly
      }
    }
    // If not viewing but in an active state (e.g. MOTION_DETECTED), and distance is far, return to neutral.
    // This makes ultrasonic the source of truth for presence.
    else if (currentState != IDLE && currentState != RETURNING_NEUTRAL) {
      newState = RETURNING_NEUTRAL;
    }
  }

  // State change debouncing
  bool allowStateChange = (currentTime - lastStateChangeTime) >= STATE_CHANGE_DEBOUNCE;

  // Exception: Allow immediate transition from MOTION_DETECTED to viewing states
  if (currentState == MOTION_DETECTED &&
      (newState == VIEWING_CLOSE || newState == VIEWING_MEDIUM || newState == VIEWING_FAR)) {
    allowStateChange = true;
  }

  // Exception: Allow immediate transition if distance changes dramatically
  static float lastLoggedDistance = 999.0;
  if (abs(lastStableDistance - lastLoggedDistance) > 50) {
    allowStateChange = true;
    lastLoggedDistance = lastStableDistance;
  }

  // State change logging (ONLY if debounced)
  if (newState != currentState && allowStateChange) {
    previousState = currentState;
    currentState = newState;
    lastStateChangeTime = currentTime;
    hasLoggedIdle = false;

    switch(currentState) {
      case VIEWING_CLOSE:
        Serial.println("━━━ State: VIEWING_CLOSE (< 50cm) ━━━");
        // If user was previously considered 'passed' or not yet classified, upgrade to 'arrived'
        if (lastSentWsState == WS_STATE_NONE || lastSentWsState == WS_STATE_PASSED) {
          sendWsUserState(WS_STATE_ARRIVED, lastStableDistance);
          lastSentWsState = WS_STATE_ARRIVED;
        }
        break;
      case VIEWING_MEDIUM:
        Serial.println("━━━ State: VIEWING_MEDIUM (50-100cm) ━━━");
        // If user was previously considered 'passed' or not yet classified, upgrade to 'arrived'
        if (lastSentWsState == WS_STATE_NONE || lastSentWsState == WS_STATE_PASSED) {
          sendWsUserState(WS_STATE_ARRIVED, lastStableDistance);
          lastSentWsState = WS_STATE_ARRIVED;
        }
        break;
      case VIEWING_FAR:
        Serial.println("━━━ State: VIEWING_FAR (100-500cm) ━━━");
        // Only send 'passed' if no other state has been sent yet
        if (lastSentWsState == WS_STATE_NONE) {
          sendWsUserState(WS_STATE_PASSED, lastStableDistance);
          lastSentWsState = WS_STATE_PASSED;
        }
        break;
      case USER_DEPARTING:
        Serial.println("━━━ State: USER_DEPARTING ━━━");
        if (lastSentWsState != WS_STATE_LEAVED) {
          sendWsUserState(WS_STATE_LEAVED, lastStableDistance);
          lastSentWsState = WS_STATE_LEAVED;
        }
        break;
      case RETURNING_NEUTRAL:
        Serial.println("━━━ State: RETURNING_NEUTRAL (> 500cm) ━━━");
        break;
    }
  }

  // Move tilt servos if angle changed
  if (targetTiltAngle != currentTiltAngle) {
    rampMoveTilt(targetTiltAngle);
  }

  // Return to IDLE after returning to neutral
  if (currentState == RETURNING_NEUTRAL && currentTiltAngle == TILT_NEUTRAL) {
    if (!hasLoggedIdle) {
      currentState = IDLE;
      digitalWrite(LED_PIN, LOW);
      Serial.println("━━━ State: IDLE ━━━\n");
      hasLoggedIdle = true;
      lastSentWsState = WS_STATE_NONE; // Reset WebSocket state

      // Reset distance tracking
      lastStableDistance = 999.0;
      for (int i = 0; i < MEDIAN_SAMPLES; i++) {
        distanceBuffer[i] = 999.0;
      }
    } else {
      currentState = IDLE;
    }
  }
}

// ============================================
// RANDOM HEAD MOVEMENT
// ============================================
void loopRandomHead(unsigned long currentTime) {

  // Only move head when IDLE and scanning enabled
  if (currentState != IDLE || !headScanEnabled) {
    return;
  }

  if (currentTime >= nextHeadMoveTime) {
    // Bounded random walk within range
    int stepMag = random(headRandomStepMinDeg, headRandomStepMaxDeg + 1);
    int dir = random(0, 2) == 0 ? -1 : 1;

    int tentative = headServo.currentAngle + dir * stepMag;
    // If out of bounds, reflect back into range
    if (tentative < headMinAngle) {
      tentative = headMinAngle + (headMinAngle - tentative);
      tentative = constrain(tentative, headMinAngle, headMaxAngle);
    } else if (tentative > headMaxAngle) {
      tentative = headMaxAngle - (tentative - headMaxAngle);
      tentative = constrain(tentative, headMinAngle, headMaxAngle);
    }

    int targetAngle = constrain(tentative, headMinAngle, headMaxAngle);

    Serial.print("Head: Random scan to ");
    Serial.print(targetAngle);
    Serial.println("°");

    moveHeadSmooth(targetAngle);

    nextHeadMoveTime = currentTime + random(HEAD_MOVE_INTERVAL_MIN, HEAD_MOVE_INTERVAL_MAX);
  }
}

// ============================================
// SERIAL COMMAND HANDLING
// ============================================
void handleSerialCommands() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();

    // TILT SERVO COMMANDS
    if (command.startsWith("T ")) {
      // Move tilt to specific angle: T <angle>
      int angle = command.substring(2).toInt();
      if (angle >= TILT_MIN && angle <= TILT_MAX) {
        Serial.print("Moving tilt to: ");
        Serial.print(angle);
        Serial.println("°");
        rampMoveTilt(angle);
      } else {
        Serial.print("Invalid tilt angle! Use ");
        Serial.print(TILT_MIN);
        Serial.print("-");
        Serial.println(TILT_MAX);
      }
    }

    else if (command.startsWith("TL ")) {
      // Move left tilt servo only: TL <angle>
      int angle = command.substring(3).toInt();
      if (angle >= TILT_MIN && angle <= TILT_MAX) {
        Serial.print("Moving LEFT tilt to: ");
        Serial.print(angle);
        Serial.println("°");
        tiltLeft.write(angle);
      } else {
        Serial.println("Invalid angle!");
      }
    }

    else if (command.startsWith("TR ")) {
      // Move right tilt servo only: TR <angle>
      int angle = command.substring(3).toInt();
      if (angle >= TILT_MIN && angle <= TILT_MAX) {
        Serial.print("Moving RIGHT tilt to: ");
        Serial.print(angle);
        Serial.println("°");
        tiltRight.write(angle);
      } else {
        Serial.println("Invalid angle!");
      }
    }

    else if (command.startsWith("TBOTH ")) {
      // Move both tilt servos to same angle: TBOTH <angle>
      int angle = command.substring(6).toInt();
      if (angle >= TILT_MIN && angle <= TILT_MAX) {
        Serial.print("Moving BOTH tilt servos to: ");
        Serial.print(angle);
        Serial.println("°");
        rampMoveTilt(angle);
      } else {
        Serial.println("Invalid angle!");
      }
    }

    else if (command.startsWith("TINVERTL ")) {
      // Invert left tilt servo: TINVERTL <on|off>
      String param = command.substring(9);
      if (param == "ON") {
        tiltLeft.invert = true;
        Serial.println("Left tilt servo inversion: ENABLED");
      } else if (param == "OFF") {
        tiltLeft.invert = false;
        Serial.println("Left tilt servo inversion: DISABLED");
      } else {
        Serial.println("Usage: TINVERTL ON or TINVERTL OFF");
      }
    }

    else if (command.startsWith("TINVERTR ")) {
      // Invert right tilt servo: TINVERTR <on|off>
      String param = command.substring(9);
      if (param == "ON") {
        tiltRight.invert = true;
        Serial.println("Right tilt servo inversion: ENABLED");
      } else if (param == "OFF") {
        tiltRight.invert = false;
        Serial.println("Right tilt servo inversion: DISABLED");
      } else {
        Serial.println("Usage: TINVERTR ON or TINVERTR OFF");
      }
    }

    // HEAD SERVO COMMANDS
    else if (command.startsWith("H ")) {
      // Move head to specific angle: H <angle>
      int angle = command.substring(2).toInt();
      angle = constrain(angle, 30, 150);
      Serial.print("Moving head to: ");
      Serial.print(angle);
      Serial.println("°");
      moveHeadSmooth(angle);
    }
    else if (command == "N") {
      // Move head to neutral
      Serial.println("Moving head to neutral (90°)");
      moveHeadSmooth(HEAD_NEUTRAL);
    }
    else if (command.startsWith("S ")) {
      // Enable/disable scanning: S <on|off>
      String param = command.substring(2);
      if (param == "ON") {
        headScanEnabled = true;
        Serial.println("Head scanning: ENABLED");
      } else if (param == "OFF") {
        headScanEnabled = false;
        Serial.println("Head scanning: DISABLED");
      } else {
        Serial.println("Usage: S ON or S OFF");
      }
    }
    else if (command == "CAL") {
      // Calibrate head position
      Serial.println("Calibrating head position...");
      calibrateHeadPosition();
    }
    else if (command == "STAT") {
      // Print status
      printStatus();
    }
    else if (command == "HELP") {
      // Print help
      Serial.println("\n=== Serial Commands ===");
      Serial.println("\nTILT SERVO COMMANDS:");
      Serial.println("  T <deg>        -> move both tilt servos (60-120)");
      Serial.println("  TL <deg>       -> move LEFT tilt servo only");
      Serial.println("  TR <deg>       -> move RIGHT tilt servo only");
      Serial.println("  TBOTH <deg>    -> move both tilt servos simultaneously");
      Serial.println("  TINVERTL <on|off> -> invert left tilt servo");
      Serial.println("  TINVERTR <on|off> -> invert right tilt servo");
      Serial.println("\nHEAD SERVO COMMANDS:");
      Serial.println("  H <deg>      -> move head to angle (30-150)");
      Serial.println("  N            -> head neutral (90)");
      Serial.println("  CAL          -> calibrate head position");
      Serial.println("  S <on|off>   -> enable/disable idle scan");
      Serial.println("  STAT         -> print current status");
      Serial.println("  HELP         -> show this help");
      Serial.println();
    }
    else if (command.length() > 0) {
      Serial.println("❌ Unknown command. Type HELP for available commands.");
    }
  }
}

void printStatus() {
  Serial.println("\n=== SYSTEM STATUS ===");
  Serial.print("State: ");
  switch(currentState) {
    case IDLE: Serial.println("IDLE"); break;
    case MOTION_DETECTED: Serial.println("MOTION_DETECTED"); break;
    case MEASURING_DISTANCE: Serial.println("MEASURING_DISTANCE"); break;
    case VIEWING_CLOSE: Serial.println("VIEWING_CLOSE"); break;
    case VIEWING_MEDIUM: Serial.println("VIEWING_MEDIUM"); break;
    case VIEWING_FAR: Serial.println("VIEWING_FAR"); break;
    case USER_DEPARTING: Serial.println("USER_DEPARTING"); break;
    case RETURNING_NEUTRAL: Serial.println("RETURNING_NEUTRAL"); break;
  }

  Serial.print("PIR State: ");
  Serial.print(pirState == HIGH ? "DETECTING" : "IDLE");
  Serial.print(" (Total detections: ");
  Serial.print(totalMotionDetections);
  Serial.println(")");

  Serial.print("Current Distance: ");
  Serial.print(lastStableDistance, 1);
  Serial.print(" cm (Last valid: ");
  Serial.print(lastValidDistance, 1);
  Serial.println(" cm)");

  Serial.print("Buffer Status: ");
  Serial.println(bufferFilled ? "FILLED (outlier rejection active)" : "FILLING...");

  Serial.print("Tilt Angle: ");
  Serial.print(currentTiltAngle);
  Serial.println("°");

  Serial.print("Left Tilt Invert: ");
  Serial.println(tiltLeft.invert ? "ON" : "OFF");

  Serial.print("Right Tilt Invert: ");
  Serial.println(tiltRight.invert ? "ON" : "OFF");

  Serial.print("Head Angle: ");
  Serial.print(headServo.currentAngle);
  Serial.println("°");

  Serial.print("Head Scan Enabled: ");
  Serial.println(headScanEnabled ? "YES" : "NO");

  Serial.println("========================\n");
}