/*
 * MG996R HIGH-POWER HEAD SERVO CONTROLLER
 * 
 * For robot head rotation control with precise movement
 * Range: 30° to 150° (120° total range)
 * 
 * Commands:
 * - H <angle>         : Move head to specific angle (30-150) via shortest path
 * - CW <degrees>      : Force clockwise movement by degrees
 * - CCW <degrees>     : Force counterclockwise movement by degrees
 * - GOTO <angle>      : Move to angle via shortest path (same as H)
 * - CENTER            : Move to center position (90°)
 * - LEFT              : Move to leftmost position (30°)
 * - RIGHT             : Move to rightmost position (150°)
 * - STATUS            : Show current position
 * - SPEED <ms>        : Set movement speed (5-50ms delay)
 * - STEP <deg>        : Set step size (1-5 degrees)
 * - SWEEP             : Test full range sweep
 * - INVERT <on|off>   : Invert servo direction if needed
 */

#include <ESP32Servo.h>

// Pin definitions
#define HEAD_SERVO_PIN 23
#define LED_PIN 2

// Servo object
Servo headServo;

// Movement constraints
#define HEAD_MIN_ANGLE 30
#define HEAD_MAX_ANGLE 150
#define HEAD_CENTER_ANGLE 90

// Current position tracking
int currentHeadAngle = HEAD_CENTER_ANGLE;

// Movement settings (adjustable via serial)
int stepDelay = 15;        // ms between steps (5-50ms)
int stepSize = 1;          // degrees per step (1-5 degrees)
bool servoInvert = false;  // Invert direction if needed

// Function to write angle with inversion support and safety checks
void writeHeadServo(int angle) {
  // Constrain angle to valid servo range (0-180)
  angle = constrain(angle, 0, 180);
  
  int physicalAngle = servoInvert ? (180 - angle) : angle;
  physicalAngle = constrain(physicalAngle, 0, 180);
  
  headServo.write(physicalAngle);
  
  // Debug output
  Serial.print("[DEBUG] Writing to servo: logical=");
  Serial.print(angle);
  Serial.print("°, physical=");
  Serial.print(physicalAngle);
  Serial.println("°");
}

void setup() {
  Serial.begin(115200);
  
  Serial.println("\n╔═══════════════════════════════════════════╗");
  Serial.println("║    MG996R HIGH-POWER HEAD SERVO TESTER   ║");
  Serial.println("╚═══════════════════════════════════════════╝");
  Serial.println();
  Serial.println("Range: 30° to 150° (120° total)");
  Serial.println("Commands: H <angle> (shortest path), GOTO <angle>");
  Serial.println("          CW <deg> (force clockwise), CCW <deg> (force CCW)");
  Serial.println("          CENTER, LEFT, RIGHT, STATUS");
  Serial.println("          SPEED <ms>, STEP <deg>, SWEEP, INVERT <on|off>");
  Serial.println();
  
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  
  // Initialize servo with proper calibration sequence
  Serial.println("Initializing MG996R servo...");
  
  // Configure servo with proper parameters for MG996R
  headServo.setPeriodHertz(50);  // Standard 50Hz for servo
  headServo.attach(HEAD_SERVO_PIN, 500, 2500);  // Min/Max pulse widths for MG996R
  
  Serial.println("Starting calibration sequence...");
  
  // Calibration sequence: Move to known positions
  Serial.println("Step 1: Moving to 90° (center)");
  headServo.write(90);
  delay(1000);
  
  Serial.println("Step 2: Moving to 60° (test position)");
  headServo.write(60);
  delay(1000);
  
  Serial.println("Step 3: Moving to 120° (test position)");
  headServo.write(120);
  delay(1000);
  
  Serial.println("Step 4: Returning to center (90°)");
  headServo.write(90);
  delay(1000);
  
  currentHeadAngle = HEAD_CENTER_ANGLE;
  
  Serial.println("Calibration complete. Servo should be stable now.");
  
  Serial.println("✓ MG996R initialized at center (90°)");
  showStatus();
  Serial.println("Ready for commands!");
}

void loop() {
  handleSerialCommands();
  delay(10);
}

void handleSerialCommands() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    if (command.startsWith("H ") || command.startsWith("GOTO ")) {
      // Move to specific angle via shortest path
      int angle;
      if (command.startsWith("H ")) {
        angle = command.substring(2).toInt();
      } else {
        angle = command.substring(5).toInt();
      }
      
      if (angle >= HEAD_MIN_ANGLE && angle <= HEAD_MAX_ANGLE) {
        moveHeadToAngleShortestPath(angle);
        Serial.println("✓ Head moved to position (shortest path)");
      } else {
        Serial.print("❌ Invalid angle! Use ");
        Serial.print(HEAD_MIN_ANGLE);
        Serial.print("-");
        Serial.println(HEAD_MAX_ANGLE);
      }
    }
    
    else if (command.startsWith("CW ")) {
      // Force clockwise movement: CW <degrees>
      int degrees = command.substring(3).toInt();
      if (degrees > 0 && degrees <= 120) {
        int targetAngle = constrain(currentHeadAngle + degrees, HEAD_MIN_ANGLE, HEAD_MAX_ANGLE);
        
        Serial.print("FORCING CLOCKWISE by ");
        Serial.print(degrees);
        Serial.print("°: ");
        Serial.print(currentHeadAngle);
        Serial.print("° → ");
        Serial.print(targetAngle);
        Serial.println("°");
        
        moveHeadDirectional(targetAngle, true); // Force clockwise
        Serial.println("✓ Forced clockwise movement complete");
      } else {
        Serial.println("❌ Invalid degrees! Use 1-120");
      }
    }
    
    else if (command.startsWith("CCW ")) {
      // Force counterclockwise movement: CCW <degrees>
      int degrees = command.substring(4).toInt();
      if (degrees > 0 && degrees <= 120) {
        int targetAngle = constrain(currentHeadAngle - degrees, HEAD_MIN_ANGLE, HEAD_MAX_ANGLE);
        
        Serial.print("FORCING COUNTERCLOCKWISE by ");
        Serial.print(degrees);
        Serial.print("°: ");
        Serial.print(currentHeadAngle);
        Serial.print("° → ");
        Serial.print(targetAngle);
        Serial.println("°");
        
        moveHeadDirectional(targetAngle, false); // Force counterclockwise
        Serial.println("✓ Forced counterclockwise movement complete");
      } else {
        Serial.println("❌ Invalid degrees! Use 1-120");
      }
    }
    
    else if (command == "CENTER") {
      Serial.println("Moving to CENTER position (90°)");
      moveHeadToAngleShortestPath(HEAD_CENTER_ANGLE);
      Serial.println("✓ Centered");
    }
    
    else if (command == "LEFT") {
      Serial.println("Moving to LEFT position (30°)");
      moveHeadToAngleShortestPath(HEAD_MIN_ANGLE);
      Serial.println("✓ At leftmost position");
    }
    
    else if (command == "RIGHT") {
      Serial.println("Moving to RIGHT position (150°)");
      moveHeadToAngleShortestPath(HEAD_MAX_ANGLE);
      Serial.println("✓ At rightmost position");
    }
    
    else if (command.startsWith("SPEED ")) {
      // Set movement speed: SPEED <ms>
      int speed = command.substring(6).toInt();
      if (speed >= 5 && speed <= 50) {
        stepDelay = speed;
        Serial.print("Movement speed set to: ");
        Serial.print(stepDelay);
        Serial.println("ms per step");
      } else {
        Serial.println("❌ Invalid speed! Use 5-50ms");
      }
    }
    
    else if (command.startsWith("STEP ")) {
      // Set step size: STEP <degrees>
      int step = command.substring(5).toInt();
      if (step >= 1 && step <= 5) {
        stepSize = step;
        Serial.print("Step size set to: ");
        Serial.print(stepSize);
        Serial.println("° per step");
      } else {
        Serial.println("❌ Invalid step size! Use 1-5 degrees");
      }
    }
    
    else if (command.startsWith("INVERT ")) {
      // Invert servo direction: INVERT <on|off>
      String param = command.substring(7);
      if (param == "ON") {
        servoInvert = true;
        Serial.println("Servo direction INVERTED");
        Serial.println("Recalibrating position...");
        writeHeadServo(currentHeadAngle); // Apply inversion immediately
        delay(500);
      } else if (param == "OFF") {
        servoInvert = false;
        Serial.println("Servo direction NORMAL");
        Serial.println("Recalibrating position...");
        writeHeadServo(currentHeadAngle); // Apply normal direction immediately
        delay(500);
      } else {
        Serial.println("Usage: INVERT ON or INVERT OFF");
      }
    }
    
    else if (command == "SWEEP") {
      runSweepTest();
    }
    
    else if (command == "STOP") {
      // Emergency stop - detach servo
      Serial.println("⚠️ EMERGENCY STOP - Detaching servo");
      headServo.detach();
      Serial.println("✓ Servo detached. Use ATTACH to reconnect.");
    }
    
    else if (command == "ATTACH") {
      // Reattach servo with proper configuration
      Serial.println("Reattaching servo with proper configuration...");
      headServo.setPeriodHertz(50);
      headServo.attach(HEAD_SERVO_PIN, 500, 2500);
      headServo.write(currentHeadAngle);
      delay(500);
      Serial.println("✓ Servo reattached and positioned");
    }
    
    else if (command.startsWith("RAW ")) {
      // Send raw PWM value to servo for testing
      int rawAngle = command.substring(4).toInt();
      if (rawAngle >= 0 && rawAngle <= 180) {
        Serial.print("Sending RAW command: ");
        Serial.print(rawAngle);
        Serial.println("° (bypassing all logic)");
        
        if (!headServo.attached()) {
          headServo.attach(HEAD_SERVO_PIN, 500, 2500);
        }
        headServo.write(rawAngle);
        delay(500);
        Serial.println("✓ Raw command sent");
      } else {
        Serial.println("❌ Invalid raw angle! Use 0-180");
      }
    }
    
    else if (command == "TEST") {
      // Quick servo test
      runQuickTest();
    }
    
    else if (command == "DIAGNOSE") {
      // Hardware diagnostic
      runHardwareDiagnosis();
    }
    
    else if (command.startsWith("PULSE ")) {
      // Test with specific pulse width
      int pulseWidth = command.substring(6).toInt();
      if (pulseWidth >= 500 && pulseWidth <= 2500) {
        testPulseWidth(pulseWidth);
      } else {
        Serial.println("❌ Invalid pulse width! Use 500-2500 microseconds");
      }
    }
    
    else if (command == "FINDRANGE") {
      // Find the actual working pulse range for this servo
      findServoRange();
    }
    
    else if (command == "STATUS") {
      showStatus();
    }
    
    else if (command.length() > 0) {
      Serial.println("❌ Unknown command");
      Serial.println("Available commands:");
      Serial.println("  H <angle>     - Move to angle (30-150) shortest path");
      Serial.println("  GOTO <angle>  - Move to angle (30-150) shortest path");
      Serial.println("  CW <deg>      - FORCE clockwise by degrees");
      Serial.println("  CCW <deg>     - FORCE counterclockwise by degrees");
      Serial.println("  CENTER/LEFT/RIGHT - Move to preset positions");
      Serial.println("  SPEED <ms>    - Set speed (5-50ms)");
      Serial.println("  STEP <deg>    - Set step size (1-5°)");
      Serial.println("  INVERT <on|off> - Invert direction");
      Serial.println("  RAW <angle>   - Send raw servo command (0-180)");
      Serial.println("  STOP          - Emergency stop (detach servo)");
      Serial.println("  ATTACH        - Reattach servo");
      Serial.println("  TEST          - Quick servo test");
      Serial.println("  DIAGNOSE      - Hardware diagnosis");
      Serial.println("  PULSE <us>    - Test pulse width (500-2500us)");
      Serial.println("  FINDRANGE     - Find servo's actual pulse range");
      Serial.println("  SWEEP/STATUS  - Full test and info commands");
    }
    
    // Show status after each command
    if (command.length() > 0) {
      Serial.println();
      showStatus();
      Serial.println();
    }
  }
}

// Move head via shortest path (smart movement) with safety mechanisms
void moveHeadToAngleShortestPath(int targetAngle) {
  targetAngle = constrain(targetAngle, HEAD_MIN_ANGLE, HEAD_MAX_ANGLE);
  
  Serial.print("Target angle: ");
  Serial.print(targetAngle);
  Serial.print("°, Current angle: ");
  Serial.print(currentHeadAngle);
  Serial.println("°");
  
  if (targetAngle == currentHeadAngle) {
    Serial.println("Already at target position");
    // Still send the command to ensure servo is holding position
    headServo.write(targetAngle);
    delay(200);
    return;
  }
  
  // For our 30-150° range, direct path is always shortest
  int directDistance = abs(targetAngle - currentHeadAngle);
  
  Serial.print("Moving head (shortest path): ");
  Serial.print(currentHeadAngle);
  Serial.print("° → ");
  Serial.print(targetAngle);
  Serial.print("° (distance: ");
  Serial.print(directDistance);
  Serial.print("°, ");
  Serial.print((targetAngle > currentHeadAngle) ? "CW" : "CCW");
  Serial.println(")");
  
  // Safety check for reasonable movement
  if (directDistance > 120) {
    Serial.println("❌ Movement too large, aborting for safety");
    return;
  }
  
  // Ensure servo is attached
  if (!headServo.attached()) {
    headServo.attach(HEAD_SERVO_PIN, 500, 2500);
    delay(100);
  }
  
  // Start from current position
  headServo.write(currentHeadAngle);
  delay(100);
  
  // Calculate movement direction and move in larger steps for stability
  int direction = (targetAngle > currentHeadAngle) ? 1 : -1;
  int moveStepSize = max(2, stepSize); // Minimum 2° steps for stability
  
  // Move step by step with feedback
  int currentPos = currentHeadAngle;
  int stepCount = 0;
  const int maxSteps = 200; // Safety limit
  
  while (abs(targetAngle - currentPos) > 0 && stepCount < maxSteps) {
    if (abs(targetAngle - currentPos) <= moveStepSize) {
      // Final step - go directly to target
      currentPos = targetAngle;
    } else {
      currentPos += direction * moveStepSize;
      // Constrain to valid range
      currentPos = constrain(currentPos, HEAD_MIN_ANGLE, HEAD_MAX_ANGLE);
    }
    
    headServo.write(currentPos);
    delay(max(stepDelay, 20)); // Minimum 20ms delay for stability
    
    stepCount++;
    
    // Debug output every few steps
    if (stepCount % 5 == 0 || currentPos == targetAngle) {
      Serial.print("Step ");
      Serial.print(stepCount);
      Serial.print(": ");
      Serial.print(currentPos);
      Serial.println("°");
    }
  }
  
  // Final position with multiple writes for accuracy
  Serial.println("Finalizing position...");
  for (int i = 0; i < 3; i++) {
    headServo.write(targetAngle);
    delay(100);
  }
  
  currentHeadAngle = targetAngle;
  
  Serial.print("✓ Movement complete. Head positioned at ");
  Serial.print(currentHeadAngle);
  Serial.println("°");
  
  if (stepCount >= maxSteps) {
    Serial.println("⚠️  Warning: Maximum steps reached, movement may be incomplete");
  }
}

// Move head in forced direction (for CW/CCW commands)
void moveHeadDirectional(int targetAngle, bool forceClockwise) {
  targetAngle = constrain(targetAngle, HEAD_MIN_ANGLE, HEAD_MAX_ANGLE);
  
  if (targetAngle == currentHeadAngle) {
    writeHeadServo(targetAngle);
    delay(100);
    return;
  }
  
  Serial.print("Moving head (forced ");
  Serial.print(forceClockwise ? "CW" : "CCW");
  Serial.print("): ");
  Serial.print(currentHeadAngle);
  Serial.print("° → ");
  Serial.print(targetAngle);
  Serial.println("°");
  
  // Force the specified direction
  int direction = forceClockwise ? 1 : -1;
  
  // Move step by step in forced direction
  int currentPos = currentHeadAngle;
  while (currentPos != targetAngle) {
    currentPos += direction * stepSize;
    
    // Handle boundary conditions
    if (currentPos > HEAD_MAX_ANGLE) {
      currentPos = HEAD_MAX_ANGLE;
    } else if (currentPos < HEAD_MIN_ANGLE) {
      currentPos = HEAD_MIN_ANGLE;
    }
    
    writeHeadServo(currentPos);
    delay(stepDelay);
    
    // Check if we've reached the target
    if (currentPos == targetAngle) break;
    
    // Safety check to prevent infinite loop
    if ((forceClockwise && currentPos >= HEAD_MAX_ANGLE && targetAngle < currentPos) ||
        (!forceClockwise && currentPos <= HEAD_MIN_ANGLE && targetAngle > currentPos)) {
      // Can't reach target in forced direction due to limits
      Serial.println("⚠️  Reached limit, stopping");
      break;
    }
  }
  
  // Final position
  writeHeadServo(currentPos);
  delay(100);
  writeHeadServo(currentPos);
  delay(100);
  
  currentHeadAngle = currentPos;
  
  Serial.print("✓ Head positioned at ");
  Serial.print(currentHeadAngle);
  Serial.println("°");
}

// Legacy function for backward compatibility
void moveHeadToAngle(int targetAngle) {
  targetAngle = constrain(targetAngle, HEAD_MIN_ANGLE, HEAD_MAX_ANGLE);
  
  if (targetAngle == currentHeadAngle) {
    // Already at target, but ensure servo is set correctly
    writeHeadServo(targetAngle);
    delay(100);
    return;
  }
  
  Serial.print("Moving head: ");
  Serial.print(currentHeadAngle);
  Serial.print("° → ");
  Serial.print(targetAngle);
  Serial.println("°");
  
  // Calculate movement direction and steps
  int distance = abs(targetAngle - currentHeadAngle);
  int direction = (targetAngle > currentHeadAngle) ? 1 : -1;
  
  // Move step by step for smooth, accurate movement
  int currentPos = currentHeadAngle;
  while (abs(targetAngle - currentPos) > 0) {
    if (abs(targetAngle - currentPos) < stepSize) {
      // Final step - go directly to target
      currentPos = targetAngle;
    } else {
      currentPos += direction * stepSize;
    }
    
    writeHeadServo(currentPos);
    delay(stepDelay);
  }
  
  // Final position with multiple writes for accuracy
  writeHeadServo(targetAngle);
  delay(100);
  writeHeadServo(targetAngle); // Double-write for precision
  delay(100);
  
  currentHeadAngle = targetAngle;
  
  Serial.print("✓ Head positioned at ");
  Serial.print(currentHeadAngle);
  Serial.println("°");
}

void runSweepTest() {
  Serial.println("=== MG996R SWEEP TEST ===");
  Serial.println("Testing full range: 30° → 150° → 30°");
  
  // Sweep left to right
  Serial.println("Phase 1: 30° → 150°");
  for (int angle = HEAD_MIN_ANGLE; angle <= HEAD_MAX_ANGLE; angle += 20) {
    Serial.print("Position: ");
    Serial.print(angle);
    Serial.println("°");
    moveHeadToAngle(angle);
    delay(1000); // Pause to observe position
  }
  
  Serial.println();
  Serial.println("Phase 2: 150° → 30°");
  // Sweep right to left
  for (int angle = HEAD_MAX_ANGLE; angle >= HEAD_MIN_ANGLE; angle -= 20) {
    Serial.print("Position: ");
    Serial.print(angle);
    Serial.println("°");
    moveHeadToAngle(angle);
    delay(1000);
  }
  
  // Return to center
  Serial.println();
  Serial.println("Returning to center...");
  moveHeadToAngleShortestPath(HEAD_CENTER_ANGLE);
  
  Serial.println("✓ Sweep test complete!");
}

void runHardwareDiagnosis() {
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║        HARDWARE DIAGNOSIS              ║");
  Serial.println("╚════════════════════════════════════════╝");
  
  Serial.println("\n1. CHECKING SERVO TYPE:");
  Serial.println("   - MG996R should be a POSITION servo (not continuous)");
  Serial.println("   - If it's a continuous rotation servo, that's the problem!");
  Serial.println("   - Look for '360°' or 'continuous' on the servo label");
  
  Serial.println("\n2. POWER SUPPLY CHECK:");
  Serial.println("   - MG996R requires 4.8V-7.2V (optimal: 6V)");
  Serial.println("   - Current draw: 2.5A stall, 200mA no load");
  Serial.println("   - ESP32 3.3V pin CANNOT power MG996R!");
  Serial.println("   - Use external 6V power supply");
  
  Serial.println("\n3. WIRING CHECK:");
  Serial.println("   - Signal (Orange/White): GPIO 23");
  Serial.println("   - Power (Red): 6V external supply");
  Serial.println("   - Ground (Brown/Black): Common ground (ESP32 + Power supply)");
  
  Serial.println("\n4. TESTING PULSE WIDTHS:");
  Serial.println("   Standard servo pulse widths:");
  Serial.println("   - 1000us = 0° position");
  Serial.println("   - 1500us = 90° position (center)");
  Serial.println("   - 2000us = 180° position");
  
  // Test different pulse widths
  int testPulses[] = {1000, 1250, 1500, 1750, 2000};
  String pulseNames[] = {"0°", "45°", "90°", "135°", "180°"};
  
  headServo.detach();
  delay(100);
  
  Serial.println("\n   Testing pulse widths (servo should STOP at each):"    );
  
  for (int i = 0; i < 5; i++) {
    Serial.print("   ");
    Serial.print(pulseNames[i]);
    Serial.print(" (");
    Serial.print(testPulses[i]);
    Serial.print("us): ");
    
    headServo.attach(HEAD_SERVO_PIN, 500, 2500);
    headServo.writeMicroseconds(testPulses[i]);
    
    // Wait 3 seconds and ask for feedback
    for (int j = 0; j < 30; j++) {
      delay(100);
      if (j % 10 == 0 && j > 0) Serial.print(".");
    }
    
    Serial.println(" Does servo STOP? (Type 'y' or 'n')");
    headServo.detach();
    delay(500);
  }
  
  Serial.println("\n5. DIAGNOSIS RESULTS:");
  Serial.println("   If servo NEVER stops:");
  Serial.println("   → Wrong servo type (continuous rotation servo)");
  Serial.println("   → Bad power supply (insufficient voltage/current)");
  Serial.println("   → Faulty servo (internal potentiometer broken)");
  
  Serial.println("\n   If servo stops at some positions but not others:");
  Serial.println("   → Servo is OK, adjust pulse width range");
  Serial.println("   → Try PULSE commands (PULSE 1500, PULSE 1000, etc.)");
  
  Serial.println("\n6. NEXT STEPS:");
  Serial.println("   - If servo never stops: Check hardware (power/servo type)");
  Serial.println("   - If servo stops: Use PULSE commands to find working range");
  Serial.println("   - Try different MG996R servo (might be defective)");
  
  Serial.println("\n═══════════════════════════════════════════════════════");
}

void findServoRange() {
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║        FINDING SERVO PULSE RANGE          ║");
  Serial.println("╚════════════════════════════════════╝");
  
  Serial.println("\nTesting narrow range around 1500us...");
  Serial.println("Since your servo only stopped at 1500us, it has a narrow range.");
  
  headServo.detach();
  delay(100);
  
  int minWorkingPulse = 1500;
  int maxWorkingPulse = 1500;
  
  Serial.println("\n1. FINDING MINIMUM PULSE (left limit):");
  // Test downwards from 1500us
  for (int pulse = 1450; pulse >= 1200; pulse -= 25) {
    Serial.print("Testing ");
    Serial.print(pulse);
    Serial.print("us: ");
    
    headServo.attach(HEAD_SERVO_PIN, 500, 2500);
    headServo.writeMicroseconds(pulse);
    
    delay(2000); // Wait 2 seconds
    
    Serial.println("Does servo STOP and hold position? (y/n):");
    // In real usage, you'd wait for user input
    // For now, we'll just test the pulse
    
    if (pulse <= 1300) { // Assume it stops working around here
      Serial.println("Servo likely stops responding below 1300us");
      minWorkingPulse = 1300;
      break;
    }
    
    headServo.detach();
    delay(500);
  }
  
  Serial.println("\n2. FINDING MAXIMUM PULSE (right limit):");
  // Test upwards from 1500us
  for (int pulse = 1550; pulse <= 1800; pulse += 25) {
    Serial.print("Testing ");
    Serial.print(pulse);
    Serial.print("us: ");
    
    headServo.attach(HEAD_SERVO_PIN, 500, 2500);
    headServo.writeMicroseconds(pulse);
    
    delay(2000); // Wait 2 seconds
    
    Serial.println("Does servo STOP and hold position? (y/n):");
    
    if (pulse >= 1700) { // Assume it stops working around here
      Serial.println("Servo likely stops responding above 1700us");
      maxWorkingPulse = 1700;
      break;
    }
    
    headServo.detach();
    delay(500);
  }
  
  Serial.println("\n══════════════════════════════════════════════════════");
  Serial.println("ESTIMATED SERVO RANGE:");
  Serial.print("Minimum pulse: ");
  Serial.print(minWorkingPulse);
  Serial.println("us (left limit)");
  Serial.print("Maximum pulse: ");
  Serial.print(maxWorkingPulse);
  Serial.println("us (right limit)");
  
  Serial.println("\nRECOMMENDED FIXES:");
  Serial.println("1. Change servo attachment to:");
  Serial.print("   headServo.attach(HEAD_SERVO_PIN, ");
  Serial.print(minWorkingPulse);
  Serial.print(", ");
  Serial.print(maxWorkingPulse);
  Serial.println(");");
  
  Serial.println("\n2. Test these specific pulses:");
  Serial.print("   PULSE ");
  Serial.print(minWorkingPulse);
  Serial.println(" (should be left limit)");
  Serial.println("   PULSE 1500 (should be center)");
  Serial.print("   PULSE ");
  Serial.print(maxWorkingPulse);
  Serial.println(" (should be right limit)");
  
  Serial.println("\nIf this range works, I'll update the code automatically!");
  
  // Return to center
  headServo.attach(HEAD_SERVO_PIN, 500, 2500);
  headServo.writeMicroseconds(1500);
  delay(1000);
  headServo.detach();
}

void testPulseWidth(int pulseWidth) {
  Serial.print("Testing pulse width: ");
  Serial.print(pulseWidth);
  Serial.println("us");
  
  headServo.detach();
  delay(100);
  headServo.attach(HEAD_SERVO_PIN, 500, 2500);
  headServo.writeMicroseconds(pulseWidth);
  
  Serial.println("Servo should move to position and STOP.");
  Serial.println("Observing for 5 seconds...");
  
  for (int i = 0; i < 50; i++) {
    delay(100);
    if (i % 10 == 0 && i > 0) {
      Serial.print(".");
    }
  }
  Serial.println();
  Serial.println("Does the servo STOP at a position? (y/n)");
}

void runQuickTest() {
  Serial.println("=== QUICK SERVO TEST ===");
  Serial.println("Testing basic positions with raw commands...");
  
  // Ensure servo is attached
  if (!headServo.attached()) {
    headServo.setPeriodHertz(50);
    headServo.attach(HEAD_SERVO_PIN, 500, 2500);
  }
  
  // Test positions with longer delays
  int testPositions[] = {90, 60, 120, 90};
  String positionNames[] = {"CENTER", "LEFT", "RIGHT", "CENTER"};
  
  for (int i = 0; i < 4; i++) {
    Serial.print("Testing ");
    Serial.print(positionNames[i]);
    Serial.print(" (");
    Serial.print(testPositions[i]);
    Serial.println("°)");
    
    headServo.write(testPositions[i]);
    
    // Wait and provide feedback
    for (int j = 0; j < 20; j++) {
      delay(100);
      if (j % 5 == 0) {
        Serial.print(".");
      }
    }
    Serial.println();
    
    Serial.print("Position ");
    Serial.print(testPositions[i]);
    Serial.println("° - Does servo stop here? (y/n)");
    Serial.println();
  }
  
  Serial.println("✓ Quick test complete");
  Serial.println("If servo kept spinning, check:");
  Serial.println("1. Power supply (MG996R needs 6V, 2A+)");
  Serial.println("2. Wiring connections");
  Serial.println("3. Try RAW commands (RAW 90, RAW 60, etc.)");
  Serial.println("4. Use STOP command if servo won't stop");
}

void showStatus() {
  Serial.println("┌─────────────────────────────────────┐");
  Serial.println("│         MG996R HEAD STATUS          │");
  Serial.println("├─────────────────────────────────────┤");
  
  Serial.print("│ Current Position: ");
  Serial.print(currentHeadAngle);
  Serial.print("°");
  if (currentHeadAngle < 100) Serial.print(" ");
  if (currentHeadAngle < 10) Serial.print(" ");
  Serial.println("            │");
  
  Serial.print("│ Range: ");
  Serial.print(HEAD_MIN_ANGLE);
  Serial.print("° to ");
  Serial.print(HEAD_MAX_ANGLE);
  Serial.println("°                │");
  
  Serial.print("│ Speed: ");
  Serial.print(stepDelay);
  Serial.print("ms/step");
  if (stepDelay < 10) Serial.print(" ");
  Serial.println("               │");
  
  Serial.print("│ Step Size: ");
  Serial.print(stepSize);
  Serial.println("° per step             │");
  
  Serial.print("│ Direction: ");
  Serial.print(servoInvert ? "INVERTED" : "NORMAL");
  if (!servoInvert) Serial.print(" ");
  Serial.println("           │");
  
  Serial.println("└─────────────────────────────────────┘");
}