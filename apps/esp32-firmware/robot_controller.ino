/*
 * PHASE 3: PIR + Ultrasonic Distance + Tilt + Random Head
 * 
 * Logic:
 * - PIR detects motion
 * - Ultrasonic confirms distance
 * - Tilt tablet only if person within viewing range
 * - Head scans randomly when idle
 * 
 * CONFIGURATION: Set ULTRASONIC_MODE below
 */

#include <ESP32Servo.h>

// ============================================
// ULTRASONIC MODE CONFIGURATION
// ============================================
// Set to 'true' if you have voltage divider installed
// Set to 'false' to use simulated distance (for testing without resistors)
#define ULTRASONIC_REAL_MODE true  // CHANGE TO false IF NO RESISTORS

// Pin definitions
#define PIR_PIN 14
#define TILT_LEFT_PIN 19
#define TILT_RIGHT_PIN 21
#define HEAD_PIN 23
#define LED_PIN 2

// Ultrasonic pins
#define TRIG_PIN 13
#define ECHO_PIN 18

// Servo objects
Servo tiltLeft;
Servo tiltRight;
Servo headServo;

// Tilt angles
#define TILT_MIN 60
#define TILT_MAX 120
#define TILT_NEUTRAL 90

// Head angles
#define HEAD_MIN 30
#define HEAD_MAX 150
#define HEAD_NEUTRAL 90

// Distance thresholds (cm)
#define DISTANCE_VERY_CLOSE 50    // < 50cm: Max tilt
#define DISTANCE_CLOSE 100        // 50-100cm: Medium tilt
#define DISTANCE_VIEWING 150      // 100-150cm: Slight tilt
#define DISTANCE_FAR 200          // > 150cm: Return to neutral

// Distance zone tilt angles
#define TILT_VERY_CLOSE 120   // Lean back more when very close
#define TILT_CLOSE 105        // Standard viewing angle
#define TILT_VIEWING 95       // Slight tilt
#define TILT_FAR TILT_NEUTRAL // Neutral when far

// Hysteresis (prevent oscillation)
#define DISTANCE_HYSTERESIS 10  // cm buffer zone

// System states
enum SystemState {
  IDLE,
  MOTION_DETECTED,
  MEASURING_DISTANCE,
  VIEWING_CLOSE,
  VIEWING_MEDIUM,
  VIEWING_FAR,
  RETURNING_NEUTRAL
};

SystemState currentState = IDLE;
SystemState previousState = IDLE;

// Current positions
int currentTiltAngle = TILT_NEUTRAL;
int currentHeadAngle = HEAD_NEUTRAL;

// Timing variables
unsigned long lastPIRTrigger = 0;
unsigned long lastDistanceCheck = 0;
unsigned long lastHeadMoveTime = 0;
unsigned long nextHeadMoveTime = 0;

const unsigned long PIR_TIMEOUT = 3000;           // 3s no motion = check distance again
const unsigned long DISTANCE_CHECK_INTERVAL = 500; // Check distance every 500ms
const unsigned long HEAD_MOVE_INTERVAL_MIN = 6000;  // 6 seconds
const unsigned long HEAD_MOVE_INTERVAL_MAX = 15000; // 15 seconds

// Distance measurement
float currentDistance = 999.0;
float lastStableDistance = 999.0;

unsigned long lastStateChangeTime = 0;
const unsigned long STATE_CHANGE_DEBOUNCE = 2000;  // 2 seconds minimum between state changes
bool hasLoggedIdle = false;  // Prevent repeated IDLE logs

unsigned long lastDistanceLogTime = 0;
const unsigned long DISTANCE_LOG_INTERVAL = 500;

// Median filter buffer
#define MEDIAN_SAMPLES 5
float distanceBuffer[MEDIAN_SAMPLES];
int bufferIndex = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("\n╔════════════════════════════════════════════╗");
  Serial.println("║  PHASE 3: Distance-Based Tilt Control     ║");
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
  
  // Initialize distance buffer
  for (int i = 0; i < MEDIAN_SAMPLES; i++) {
    distanceBuffer[i] = 999.0;
  }
  
  setupTiltServos();
  setupHeadServo();
  
  Serial.println("\n✓ System initialized");
  Serial.println("✓ Tilt at neutral (90°)");
  Serial.println("✓ Head at neutral (90°)");
  Serial.println("\nDistance Zones:");
  Serial.println("  < 50cm   = Very Close (tilt 115°)");
  Serial.println("  50-100cm = Close (tilt 105°)");
  Serial.println("  100-150cm = Viewing (tilt 95°)");
  Serial.println("  > 150cm  = Far (neutral 90°)");
  Serial.println("\nState: IDLE - Waiting for motion\n");
  
  nextHeadMoveTime = millis() + random(HEAD_MOVE_INTERVAL_MIN, HEAD_MOVE_INTERVAL_MAX);
}

void loop() {
  unsigned long currentTime = millis();
  
  // Core logic loops
  loopPIR(currentTime);
  loopDistanceMeasurement(currentTime);
  loopTiltControl(currentTime);
  loopRandomHead(currentTime);
  
  delay(10);
}

// ============================================
// PIR DETECTION
// ============================================
void loopPIR(unsigned long currentTime) {
  int pirValue = digitalRead(PIR_PIN);
  
  if (pirValue == HIGH) {
    lastPIRTrigger = currentTime;
    
    if (currentState == IDLE) {
      Serial.println("\n━━━ MOTION DETECTED ━━━");
      currentState = MOTION_DETECTED;
      digitalWrite(LED_PIN, HIGH);
    }
  }
  
  // If no motion for PIR_TIMEOUT, consider returning to idle
  if ((currentTime - lastPIRTrigger) > PIR_TIMEOUT) {
    if (currentState != IDLE && currentState != RETURNING_NEUTRAL) {
      // Will be handled by distance check
    }
  }
}

// ============================================
// DISTANCE MEASUREMENT
// ============================================
void loopDistanceMeasurement(unsigned long currentTime) {
  
  // Only measure distance when motion detected or in viewing states
  if (currentState == IDLE) {
    return;
  }
  
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
    
    // Get filtered distance
    float filteredDistance = getMedianDistance();
    
    // Update stable distance with hysteresis
    if (abs(filteredDistance - lastStableDistance) > DISTANCE_HYSTERESIS) {
      lastStableDistance = filteredDistance;
      
      // ==== THROTTLED LOGGING ====
      // Only log distance if enough time has passed OR significant change
      bool shouldLog = false;
      
      if ((currentTime - lastDistanceLogTime) >= DISTANCE_LOG_INTERVAL) {
        shouldLog = true;
      }
      
      // Or if distance changed by more than 30cm (significant movement)
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
  // Speed of sound = 343 m/s = 29.15 µs/cm (round trip)
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
    simDistance = 300.0 - (elapsed / 40.0);  // 250cm in 10s = 25cm/s
    
    if (simDistance < 50.0) {
      simDistance = 50.0;
      simApproaching = false;
      simStartTime = currentTime;  // Reset for leaving
    }
  } else {
    // Simulate leaving: 50cm → 300cm over 10 seconds
    simDistance = 50.0 + (elapsed / 40.0);
    
    if (simDistance > 300.0) {
      simDistance = 999.0;
      simStartTime = 0;  // Reset simulation
    }
  }
  
  return simDistance;
}

// Median filter to remove spurious readings
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
  
  return sorted[MEDIAN_SAMPLES / 2];  // Return middle value
}

// ============================================
// TILT CONTROL BASED ON DISTANCE
// ============================================
void loopTiltControl(unsigned long currentTime) {
  int targetTiltAngle = TILT_NEUTRAL;
  SystemState newState = currentState;
  
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
    
    // Only return to idle if no recent PIR activity
    if ((currentTime - lastPIRTrigger) > PIR_TIMEOUT) {
      newState = RETURNING_NEUTRAL;
    }
  }
  
  // ====== STATE CHANGE DEBOUNCING ======
  // Only allow state changes after debounce period
  bool allowStateChange = (currentTime - lastStateChangeTime) >= STATE_CHANGE_DEBOUNCE;
  
  // Exception: Allow immediate transition from MOTION_DETECTED to viewing states
  if (currentState == MOTION_DETECTED && 
      (newState == VIEWING_CLOSE || newState == VIEWING_MEDIUM || newState == VIEWING_FAR)) {
    allowStateChange = true;
  }
  
  // Exception: Allow immediate transition if distance changes dramatically (>50cm jump)
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
    hasLoggedIdle = false;  // Reset idle log flag
    
    switch(currentState) {
      case VIEWING_CLOSE:
        Serial.println("━━━ State: VIEWING_CLOSE (< 50cm) ━━━");
        break;
      case VIEWING_MEDIUM:
        Serial.println("━━━ State: VIEWING_MEDIUM (50-100cm) ━━━");
        break;
      case VIEWING_FAR:
        Serial.println("━━━ State: VIEWING_FAR (100-150cm) ━━━");
        break;
      case RETURNING_NEUTRAL:
        Serial.println("━━━ State: RETURNING_NEUTRAL (> 150cm) ━━━");
        break;
    }
  }
  
  // Move tilt servos if angle changed
  if (targetTiltAngle != currentTiltAngle) {
    moveTiltSmooth(targetTiltAngle);
  }
  
  // Return to IDLE after returning to neutral (LOG ONCE ONLY)
  if (currentState == RETURNING_NEUTRAL && currentTiltAngle == TILT_NEUTRAL) {
    if (!hasLoggedIdle) {  // Only log once
      currentState = IDLE;
      digitalWrite(LED_PIN, LOW);
      Serial.println("━━━ State: IDLE ━━━\n");
      hasLoggedIdle = true;
      
      // Reset distance tracking
      lastStableDistance = 999.0;
      for (int i = 0; i < MEDIAN_SAMPLES; i++) {
        distanceBuffer[i] = 999.0;
      }
    } else {
      currentState = IDLE;  // Silent transition
    }
  }
}
// ============================================
// SERVO CONTROL FUNCTIONS
// ============================================
void setupTiltServos() {
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  
  tiltLeft.write(TILT_NEUTRAL);
  tiltRight.write(TILT_NEUTRAL);
  currentTiltAngle = TILT_NEUTRAL;
  
  delay(500);
  
  tiltLeft.detach();
  tiltRight.detach();
}

void setupHeadServo() {
  headServo.attach(HEAD_PIN);
  headServo.write(HEAD_NEUTRAL);
  currentHeadAngle = HEAD_NEUTRAL;
  delay(500);
  headServo.detach();
}

void moveTiltSmooth(int targetAngle) {
  targetAngle = constrain(targetAngle, TILT_MIN, TILT_MAX);
  
  if (targetAngle == currentTiltAngle) {
    return;
  }
  
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  
  Serial.print("Tilt: ");
  Serial.print(currentTiltAngle);
  Serial.print("° → ");
  Serial.print(targetAngle);
  Serial.println("°");
  
  int step = (targetAngle > currentTiltAngle) ? 1 : -1;
  
  for (int angle = currentTiltAngle; angle != targetAngle; angle += step) {
    tiltLeft.write(angle);
    tiltRight.write(angle);
    delay(15);
  }
  
  tiltLeft.write(targetAngle);
  tiltRight.write(targetAngle);
  currentTiltAngle = targetAngle;
  
  delay(100);
  
  tiltLeft.detach();
  tiltRight.detach();
}

void moveHeadSmooth(int targetAngle) {
  targetAngle = constrain(targetAngle, HEAD_MIN, HEAD_MAX);
  
  // Fix for small movements (deadband)
  int angleDiff = abs(targetAngle - currentHeadAngle);
  if (angleDiff < 5) {
    if (targetAngle > currentHeadAngle) {
      targetAngle = currentHeadAngle + 5;
    } else {
      targetAngle = currentHeadAngle - 5;
    }
    targetAngle = constrain(targetAngle, HEAD_MIN, HEAD_MAX);
  }
  
  headServo.attach(HEAD_PIN);
  
  int step = (targetAngle > currentHeadAngle) ? 3 : -3;
  
  for (int angle = currentHeadAngle; 
       (step > 0 && angle < targetAngle) || (step < 0 && angle > targetAngle); 
       angle += step) {
    headServo.write(angle);
    delay(20);
  }
  
  headServo.write(targetAngle);
  delay(50);
  headServo.write(targetAngle);
  
  currentHeadAngle = targetAngle;
  delay(100);
  
  headServo.detach();
}

// ============================================
// RANDOM HEAD MOVEMENT (IDLE ONLY)
// ============================================
void loopRandomHead(unsigned long currentTime) {
  
  // Only move head when IDLE
  if (currentState != IDLE) {
    return;
  }
  
  if (currentTime >= nextHeadMoveTime) {
    int targetAngle = random(HEAD_MIN, HEAD_MAX + 1);
    
    Serial.print("Head: Random scan to ");
    Serial.print(targetAngle);
    Serial.println("°");
    
    moveHeadSmooth(targetAngle);
    
    nextHeadMoveTime = currentTime + random(HEAD_MOVE_INTERVAL_MIN, HEAD_MOVE_INTERVAL_MAX);
  }
}
