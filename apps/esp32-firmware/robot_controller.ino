/*
 * PHASE 3: PIR + Ultrasonic Distance + Tilt + Random Head
 * FINAL WORKING VERSION - All Compilation Issues Fixed
 * 
 * Logic:
 * - PIR detects motion
 * - Ultrasonic confirms distance
 * - Tilt tablet only if person within viewing range
 * - Head scans randomly when idle
 * - Dual tilt servos with opposite mounting support
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
 
 // Head servo angles
 #define HEAD_MIN 30
 #define HEAD_MAX 150
 #define HEAD_NEUTRAL 90
 
 // Distance thresholds (cm)
 #define DISTANCE_VERY_CLOSE 50    // < 50cm: Max tilt
 #define DISTANCE_CLOSE 100        // 50-100cm: Medium tilt
 #define DISTANCE_VIEWING 150      // 100-150cm: Slight tilt
 #define DISTANCE_FAR 200          // > 150cm: Return to neutral
 
 // Distance zone tilt angles - adjusted for opposite servo mounting
 #define TILT_VERY_CLOSE 115   // Lean back more when very close (reduced for dual servo stability)
 #define TILT_CLOSE 100        // Standard viewing angle (reduced for dual servo stability) 
 #define TILT_VIEWING 95       // Slight tilt
 #define TILT_FAR TILT_NEUTRAL // Neutral when far
 
 // Hysteresis (prevent oscillation)
 #define DISTANCE_HYSTERESIS 10  // cm buffer zone
 
 // Median filter buffer
 #define MEDIAN_SAMPLES 5
 
 // ============================================
 // SERVO OBJECTS
 // ============================================
 Servo tiltLeft;
 Servo tiltRight;
 Servo headServo;
 
 // ============================================
 // GLOBAL VARIABLES
 // ============================================
 
 // Current positions
 int currentTiltAngle = TILT_NEUTRAL;
 int currentHeadAngle = HEAD_NEUTRAL;
 
 // Opposite mounting compensation for tilt servos
 bool leftTiltServoInvert = false;   // Set to true if left tilt servo mounted opposite
 bool rightTiltServoInvert = true;   // Set to true if right tilt servo mounted opposite
 
 // Runtime-adjustable head limits and behavior
 int headMinAngle = HEAD_MIN;     
 int headMaxAngle = HEAD_MAX;     
 bool headScanEnabled = true;     
 bool headInvert = false;         
 int headStepDeg = 2;             
 unsigned long headStepDelayMs = 25; 
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
   RETURNING_NEUTRAL
 };
 
 SystemState currentState = IDLE;
 SystemState previousState = IDLE;
 
 // Timing variables
 unsigned long lastPIRTrigger = 0;
 unsigned long lastDistanceCheck = 0;
 unsigned long lastHeadMoveTime = 0;
 unsigned long nextHeadMoveTime = 0;
 
 const unsigned long PIR_TIMEOUT = 3000;           
 const unsigned long DISTANCE_CHECK_INTERVAL = 500; 
 const unsigned long HEAD_MOVE_INTERVAL_MIN = 6000;  
 const unsigned long HEAD_MOVE_INTERVAL_MAX = 15000; 
 
 // Distance measurement
 float currentDistance = 999.0;
 float lastStableDistance = 999.0;
 
 unsigned long lastStateChangeTime = 0;
 const unsigned long STATE_CHANGE_DEBOUNCE = 2000;  
 bool hasLoggedIdle = false;  
 
 unsigned long lastDistanceLogTime = 0;
 const unsigned long DISTANCE_LOG_INTERVAL = 500;
 
 // Median filter buffer
 float distanceBuffer[MEDIAN_SAMPLES];
 int bufferIndex = 0;
 
 // ============================================
 // FUNCTION DECLARATIONS
 // ============================================
 void handleSerialCommands();
 void printStatus();
 void calibrateHeadPosition();
 void moveBothTiltServos(int leftTarget, int rightTarget);
 void moveTiltSmooth(int targetAngle);
 void setupTiltServos();
 void setupHeadServo();
 void writeHead(int logicalAngle);
 void moveHeadSmooth(int targetAngle);
 void loopPIR(unsigned long currentTime);
 void loopDistanceMeasurement(unsigned long currentTime);
 void loopTiltControl(unsigned long currentTime);
 void loopRandomHead(unsigned long currentTime);
 float measureDistanceReal();
 float measureDistanceSimulated(unsigned long currentTime);
 float getMedianDistance();
 
 // ============================================
 // TILT SERVO FUNCTIONS
 // ============================================
 
 // Function to write tilt angle with inversion support and safety checks
 void writeLeftTiltServo(int angle) {
   angle = constrain(angle, 0, 180);
   int physicalAngle = leftTiltServoInvert ? (180 - angle) : angle;
   physicalAngle = constrain(physicalAngle, 0, 180);
   tiltLeft.write(physicalAngle);
 }
 
 void writeRightTiltServo(int angle) {
   angle = constrain(angle, 0, 180);
   int physicalAngle = rightTiltServoInvert ? (180 - angle) : angle;
   physicalAngle = constrain(physicalAngle, 0, 180);
   tiltRight.write(physicalAngle);
 }
 
 // Move both tilt servos simultaneously to their target angles
 void moveBothTiltServos(int leftTarget, int rightTarget) {
   leftTarget = constrain(leftTarget, TILT_MIN, TILT_MAX);
   rightTarget = constrain(rightTarget, TILT_MIN, TILT_MAX);
   
   // Attach both servos
   tiltLeft.attach(TILT_LEFT_PIN);
   tiltRight.attach(TILT_RIGHT_PIN);
   
   // Calculate distances and determine maximum steps needed
   int leftDistance = abs(leftTarget - currentTiltAngle);
   int rightDistance = abs(rightTarget - currentTiltAngle);
   int maxSteps = max(leftDistance, rightDistance);
   
   if (maxSteps == 0) {
     // Already at target positions
     tiltLeft.detach();
     tiltRight.detach();
     return;
   }
   
   // Move both servos simultaneously
   for (int step = 0; step <= maxSteps; step++) {
     // Calculate current positions for both servos
     int leftPos = currentTiltAngle + ((leftTarget - currentTiltAngle) * step) / maxSteps;
     int rightPos = currentTiltAngle + ((rightTarget - currentTiltAngle) * step) / maxSteps;
     
     writeLeftTiltServo(leftPos);
     writeRightTiltServo(rightPos);
     delay(15);
   }
   
   // Final positions
   writeLeftTiltServo(leftTarget);
   writeRightTiltServo(rightTarget);
   currentTiltAngle = leftTarget; // Assuming both servos move to same logical angle
   
   delay(100);
   
   // Detach both servos
   tiltLeft.detach();
   tiltRight.detach();
 }
 
 void moveTiltSmooth(int targetAngle) {
   targetAngle = constrain(targetAngle, TILT_MIN, TILT_MAX);
   
   if (targetAngle == currentTiltAngle) {
     return;
   }
   
   Serial.print("Tilt: ");
   Serial.print(currentTiltAngle);
   Serial.print("° → ");
   Serial.print(targetAngle);
   Serial.println("°");
   
   // Use the simultaneous movement function
   moveBothTiltServos(targetAngle, targetAngle);
 }
 
 void setupTiltServos() {
   tiltLeft.attach(TILT_LEFT_PIN);
   tiltRight.attach(TILT_RIGHT_PIN);
   
   writeLeftTiltServo(TILT_NEUTRAL);
   writeRightTiltServo(TILT_NEUTRAL);
   currentTiltAngle = TILT_NEUTRAL;
   
   delay(500);
   
   tiltLeft.detach();
   tiltRight.detach();
 }
 
 // ============================================
 // HEAD SERVO FUNCTIONS
 // ============================================
 
 // Helper to write head angle, applying inversion if enabled
 void writeHead(int logicalAngle) {
   int physical = headInvert ? (180 - logicalAngle) : logicalAngle;
   headServo.write(physical);
 }
 
 void setupHeadServo() {
   Serial.println("Initializing head servo...");
   
   headServo.attach(HEAD_PIN);
   
   // Multi-step initialization for precise positioning
   for (int i = 0; i < 3; i++) {
     int physical = headInvert ? (180 - HEAD_NEUTRAL) : HEAD_NEUTRAL;
     headServo.write(physical);
     delay(200);
   }
   
   currentHeadAngle = HEAD_NEUTRAL;
   delay(500);  
   headServo.detach();
   
   Serial.print("Head servo initialized at: ");
   Serial.print(HEAD_NEUTRAL);
   Serial.println("°");
 }
 
 // FIXED: Precise servo positioning without drift
 void moveHeadSmooth(int targetAngle) {
   // Enforce front viewing arc only
   targetAngle = constrain(targetAngle, headMinAngle, headMaxAngle);
   
   // If already at target, just ensure servo is set correctly
   if (targetAngle == currentHeadAngle) {
     // Still re-attach and re-set to ensure no drift
     headServo.attach(HEAD_PIN);
     writeHead(targetAngle);
     delay(100);  
     headServo.detach();
     
     Serial.print("Head: Already at ");
     Serial.print(targetAngle);
     Serial.println("° (re-calibrated)");
     return;
   }
   
   Serial.print("Head: ");
   Serial.print(currentHeadAngle);
   Serial.print("° → ");
   Serial.print(targetAngle);
   Serial.println("°");
   
   headServo.attach(HEAD_PIN);
   
   // CRITICAL: Always start from current known position
   writeHead(currentHeadAngle);
   delay(50);  
   
   // Calculate movement direction and distance
   int distance = abs(targetAngle - currentHeadAngle);
   int direction = (targetAngle > currentHeadAngle) ? 1 : -1;
   
   // Use smaller steps for better control
   int stepSize = min(abs(headStepDeg), 2);  
   if (stepSize < 1) stepSize = 1;
   
   // Move step by step
   int currentPos = currentHeadAngle;
   while (abs(targetAngle - currentPos) > 0) {
     if (abs(targetAngle - currentPos) < stepSize) {
       // Final step - go directly to target
       currentPos = targetAngle;
     } else {
       currentPos += direction * stepSize;
     }
     
     writeHead(currentPos);
     delay(headStepDelayMs);
   }
   
   // CRITICAL: Final position setting with multiple attempts
   writeHead(targetAngle);
   delay(100);
   writeHead(targetAngle);  
   delay(100);
   writeHead(targetAngle);  
   
   // Update tracked position
   currentHeadAngle = targetAngle;
   
   delay(100);  
   headServo.detach();
   
   Serial.print("Head: Movement complete, now at ");
   Serial.print(currentHeadAngle);
   Serial.println("°");
 }
 
 // ADDED: Calibration function to reset head to known position
 void calibrateHeadPosition() {
   Serial.println("=== HEAD CALIBRATION ===");
   
   headServo.attach(HEAD_PIN);
   
   // Move to center position multiple times
   for (int i = 0; i < 3; i++) {
     writeHead(HEAD_NEUTRAL);
     delay(200);
   }
   
   // Set tracked position
   currentHeadAngle = HEAD_NEUTRAL;
   
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
 
   // Print quick serial help
   Serial.println("\nSerial commands (type HELP for full list):");
   Serial.println("TILT: T <deg>, TL <deg>, TR <deg>, TINVERTL/R <on|off>");
   Serial.println("HEAD: H <deg>, N, CAL, S <on|off>");
   
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
   Serial.println("  50-100cm = Close (tilt 100°)");
   Serial.println("  100-150cm = Viewing (tilt 95°)");
   Serial.println("  > 150cm  = Far (neutral 90°)");
   Serial.println("\nState: IDLE - Waiting for motion\n");
   
   nextHeadMoveTime = millis() + random(HEAD_MOVE_INTERVAL_MIN, HEAD_MOVE_INTERVAL_MAX);
 }
 
 // ============================================
 // MAIN LOOP
 // ============================================
 void loop() {
   unsigned long currentTime = millis();
 
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
       // Reset head to neutral on motion detection
       moveHeadSmooth(HEAD_NEUTRAL);
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
   
   // Return to IDLE after returning to neutral
   if (currentState == RETURNING_NEUTRAL && currentTiltAngle == TILT_NEUTRAL) {
     if (!hasLoggedIdle) {  
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
 
     int tentative = currentHeadAngle + dir * stepMag;
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
         moveTiltSmooth(angle);
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
         tiltLeft.attach(TILT_LEFT_PIN);
         Serial.print("Moving LEFT tilt to: ");
         Serial.print(angle);
         Serial.println("°");
         writeLeftTiltServo(angle);
         delay(1000);
         tiltLeft.detach();
       } else {
         Serial.println("Invalid angle!");
       }
     }
     
     else if (command.startsWith("TR ")) {
       // Move right tilt servo only: TR <angle>
       int angle = command.substring(3).toInt();
       if (angle >= TILT_MIN && angle <= TILT_MAX) {
         tiltRight.attach(TILT_RIGHT_PIN);
         Serial.print("Moving RIGHT tilt to: ");
         Serial.print(angle);
         Serial.println("°");
         writeRightTiltServo(angle);
         delay(1000);
         tiltRight.detach();
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
         moveBothTiltServos(angle, angle);
       } else {
         Serial.println("Invalid angle!");
       }
     }
     
     else if (command.startsWith("TINVERTL ")) {
       // Invert left tilt servo: TINVERTL <on|off>
       String param = command.substring(9);
       if (param == "ON") {
         leftTiltServoInvert = true;
         Serial.println("Left tilt servo inversion: ENABLED");
       } else if (param == "OFF") {
         leftTiltServoInvert = false;
         Serial.println("Left tilt servo inversion: DISABLED");
       } else {
         Serial.println("Usage: TINVERTL ON or TINVERTL OFF");
       }
     }
     
     else if (command.startsWith("TINVERTR ")) {
       // Invert right tilt servo: TINVERTR <on|off>
       String param = command.substring(9);
       if (param == "ON") {
         rightTiltServoInvert = true;
         Serial.println("Right tilt servo inversion: ENABLED");
       } else if (param == "OFF") {
         rightTiltServoInvert = false;
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
     case RETURNING_NEUTRAL: Serial.println("RETURNING_NEUTRAL"); break;
   }
   
   Serial.print("Current Distance: ");
   Serial.print(lastStableDistance, 1);
   Serial.println(" cm");
   
   Serial.print("Tilt Angle: ");
   Serial.print(currentTiltAngle);
   Serial.println("°");
   
   Serial.print("Left Tilt Invert: ");
   Serial.println(leftTiltServoInvert ? "ON" : "OFF");
   
   Serial.print("Right Tilt Invert: ");
   Serial.println(rightTiltServoInvert ? "ON" : "OFF");
   
   Serial.print("Head Angle: ");
   Serial.print(currentHeadAngle);
   Serial.println("°");
   
   Serial.print("Head Scan Enabled: ");
   Serial.println(headScanEnabled ? "YES" : "NO");
   
   Serial.println("========================\n");
 }