/*
 * TILT SERVO CALIBRATION TOOL
 * 
 * This sketch helps you find the optimal angles for your two tilt servo motors.
 * Use serial commands to move both servos and find the best working range.
 * 
 * HARDWARE SETUP:
 * - Left Tilt Servo: Pin 19
 * - Right Tilt Servo: Pin 21
 * - Power: 5V to servos, GND common
 * 
 * SERIAL COMMANDS:
 * - L <angle>    : Move left servo to angle (0-180)
 * - R <angle>    : Move right servo to angle (0-180)
 * - B <angle>    : Move both servos to same angle (0-180)
 * - SYNC <L> <R> : Move left to L angle, right to R angle
 * - CW <deg>     : Move both servos clockwise by degrees
 * - CCW <deg>    : Move both servos counterclockwise by degrees
 * - LCW <deg>    : Move left servo clockwise by degrees
 * - LCCW <deg>   : Move left servo counterclockwise by degrees
 * - RCW <deg>    : Move right servo clockwise by degrees
 * - RCCW <deg>   : Move right servo counterclockwise by degrees
 * - OPPOSITE <deg> : Move left CW and right CCW by degrees
 * - SWEEP        : Sweep both servos through full range
 * - TEST         : Test common angles (60, 90, 120)
 * - HOME         : Move both to 90 degrees
 * - STATUS       : Show current positions
 * - INVERTL <on|off> : Invert left servo direction
 * - INVERTR <on|off> : Invert right servo direction
 * - HELP         : Show command list
 */

#include <ESP32Servo.h>

// Pin definitions (matching your main project)
#define TILT_LEFT_PIN 19
#define TILT_RIGHT_PIN 21
#define LED_PIN 2

// Servo objects
Servo tiltLeft;
Servo tiltRight;

// Current positions tracking
int currentLeftAngle = 90;
int currentRightAngle = 90;

// Movement settings
int moveStepDelay = 20;  // ms between steps
int stepSize = 2;        // degrees per step

// Opposite mounting compensation
bool leftServoInvert = false;   // Set to true if left servo mounted opposite
bool rightServoInvert = true;   // Set to true if right servo mounted opposite

// Function to write angle with inversion support
void writeLeftServo(int angle) {
  int physicalAngle = leftServoInvert ? (180 - angle) : angle;
  tiltLeft.write(physicalAngle);
}

void writeRightServo(int angle) {
  int physicalAngle = rightServoInvert ? (180 - angle) : angle;
  tiltRight.write(physicalAngle);
}

void setup() {
  Serial.begin(115200);
  
  // Wait for serial connection
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("\n╔════════════════════════════════════════════╗");
  Serial.println("║        TILT SERVO CALIBRATION TOOL        ║");
  Serial.println("╚════════════════════════════════════════════╝");
  Serial.println();
  
  // Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  // Show we're active
  
  // Initialize servos
  Serial.println("Initializing servos...");
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  
  // Move to neutral position
  Serial.println("Moving to neutral position (90°)...");
  moveLeftServoSmooth(90);
  moveRightServoSmooth(90);
  currentLeftAngle = 90;
  currentRightAngle = 90;
  
  Serial.println("✓ Initialization complete!");
  Serial.println();
  showHelp();
  Serial.println();
  showStatus();
  Serial.println();
  Serial.println("Ready for commands! Type HELP for command list.");
  Serial.print("> ");
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
    
    // Clear the prompt line
    Serial.println();
    
    if (command.startsWith("L ")) {
      // Move left servo: L <angle>
      int angle = command.substring(2).toInt();
      if (angle >= 0 && angle <= 180) {
        Serial.print("Moving LEFT servo: ");
        Serial.print(currentLeftAngle);
        Serial.print("° → ");
        Serial.print(angle);
        Serial.println("°");
        
        moveLeftServoSmooth(angle);
        currentLeftAngle = angle;
        Serial.println("✓ Left servo move complete");
      } else {
        Serial.println("❌ Invalid angle! Use 0-180 degrees.");
      }
    }
    
    else if (command.startsWith("R ")) {
      // Move right servo: R <angle>
      int angle = command.substring(2).toInt();
      if (angle >= 0 && angle <= 180) {
        Serial.print("Moving RIGHT servo: ");
        Serial.print(currentRightAngle);
        Serial.print("° → ");
        Serial.print(angle);
        Serial.println("°");
        
        moveRightServoSmooth(angle);
        currentRightAngle = angle;
        Serial.println("✓ Right servo move complete");
      } else {
        Serial.println("❌ Invalid angle! Use 0-180 degrees.");
      }
    }
    
    else if (command.startsWith("B ")) {
      // Move both servos: B <angle>
      int angle = command.substring(2).toInt();
      if (angle >= 0 && angle <= 180) {
        Serial.print("Moving BOTH servos to: ");
        Serial.print(angle);
        Serial.println("°");
        
        moveBothServos(angle);
        Serial.println("✓ Both servos move complete");
      } else {
        Serial.println("❌ Invalid angle! Use 0-180 degrees.");
      }
    }
    
    else if (command.startsWith("SYNC ")) {
      // Move servos to different angles: SYNC <left> <right>
      int spaceIndex = command.indexOf(' ', 5);
      if (spaceIndex > 0) {
        int leftAngle = command.substring(5, spaceIndex).toInt();
        int rightAngle = command.substring(spaceIndex + 1).toInt();
        
        if (leftAngle >= 0 && leftAngle <= 180 && rightAngle >= 0 && rightAngle <= 180) {
          Serial.print("SYNC move - Left: ");
          Serial.print(leftAngle);
          Serial.print("°, Right: ");
          Serial.print(rightAngle);
          Serial.println("°");
          
          moveSyncServos(leftAngle, rightAngle);
          Serial.println("✓ Synchronized move complete");
        } else {
          Serial.println("❌ Invalid angles! Use 0-180 degrees for both.");
        }
      } else {
        Serial.println("❌ Usage: SYNC <left_angle> <right_angle>");
      }
    }
    
    else if (command.startsWith("CW ")) {
      // Move both servos clockwise: CW <degrees>
      int degrees = command.substring(3).toInt();
      if (degrees > 0 && degrees <= 180) {
        Serial.print("Moving BOTH servos CLOCKWISE by ");
        Serial.print(degrees);
        Serial.println("°");
        
        int newLeft = constrain(currentLeftAngle + degrees, 0, 180);
        int newRight = constrain(currentRightAngle + degrees, 0, 180);
        
        Serial.print("Left: ");
        Serial.print(currentLeftAngle);
        Serial.print("° → ");
        Serial.print(newLeft);
        Serial.print("°, Right: ");
        Serial.print(currentRightAngle);
        Serial.print("° → ");
        Serial.print(newRight);
        Serial.println("°");
        
        moveSyncServos(newLeft, newRight);
        Serial.println("✓ Clockwise movement complete");
      } else {
        Serial.println("❌ Invalid degrees! Use 1-180.");
      }
    }
    
    else if (command.startsWith("CCW ")) {
      // Move both servos counterclockwise: CCW <degrees>
      int degrees = command.substring(4).toInt();
      if (degrees > 0 && degrees <= 180) {
        Serial.print("Moving BOTH servos COUNTERCLOCKWISE by ");
        Serial.print(degrees);
        Serial.println("°");
        
        int newLeft = constrain(currentLeftAngle - degrees, 0, 180);
        int newRight = constrain(currentRightAngle - degrees, 0, 180);
        
        Serial.print("Left: ");
        Serial.print(currentLeftAngle);
        Serial.print("° → ");
        Serial.print(newLeft);
        Serial.print("°, Right: ");
        Serial.print(currentRightAngle);
        Serial.print("° → ");
        Serial.print(newRight);
        Serial.println("°");
        
        moveSyncServos(newLeft, newRight);
        Serial.println("✓ Counterclockwise movement complete");
      } else {
        Serial.println("❌ Invalid degrees! Use 1-180.");
      }
    }
    
    else if (command.startsWith("LCW ")) {
      // Move left servo clockwise: LCW <degrees>
      int degrees = command.substring(4).toInt();
      if (degrees > 0 && degrees <= 180) {
        int newAngle = constrain(currentLeftAngle + degrees, 0, 180);
        Serial.print("Moving LEFT servo CLOCKWISE by ");
        Serial.print(degrees);
        Serial.print("°: ");
        Serial.print(currentLeftAngle);
        Serial.print("° → ");
        Serial.print(newAngle);
        Serial.println("°");
        
        moveLeftServoSmooth(newAngle);
        currentLeftAngle = newAngle;
        Serial.println("✓ Left clockwise movement complete");
      } else {
        Serial.println("❌ Invalid degrees! Use 1-180.");
      }
    }
    
    else if (command.startsWith("LCCW ")) {
      // Move left servo counterclockwise: LCCW <degrees>
      int degrees = command.substring(5).toInt();
      if (degrees > 0 && degrees <= 180) {
        int newAngle = constrain(currentLeftAngle - degrees, 0, 180);
        Serial.print("Moving LEFT servo COUNTERCLOCKWISE by ");
        Serial.print(degrees);
        Serial.print("°: ");
        Serial.print(currentLeftAngle);
        Serial.print("° → ");
        Serial.print(newAngle);
        Serial.println("°");
        
        moveLeftServoSmooth(newAngle);
        currentLeftAngle = newAngle;
        Serial.println("✓ Left counterclockwise movement complete");
      } else {
        Serial.println("❌ Invalid degrees! Use 1-180.");
      }
    }
    
    else if (command.startsWith("RCW ")) {
      // Move right servo clockwise: RCW <degrees>
      int degrees = command.substring(4).toInt();
      if (degrees > 0 && degrees <= 180) {
        int newAngle = constrain(currentRightAngle + degrees, 0, 180);
        Serial.print("Moving RIGHT servo CLOCKWISE by ");
        Serial.print(degrees);
        Serial.print("°: ");
        Serial.print(currentRightAngle);
        Serial.print("° → ");
        Serial.print(newAngle);
        Serial.println("°");
        
        moveRightServoSmooth(newAngle);
        currentRightAngle = newAngle;
        Serial.println("✓ Right clockwise movement complete");
      } else {
        Serial.println("❌ Invalid degrees! Use 1-180.");
      }
    }
    
    else if (command.startsWith("RCCW ")) {
      // Move right servo counterclockwise: RCCW <degrees>
      int degrees = command.substring(5).toInt();
      if (degrees > 0 && degrees <= 180) {
        int newAngle = constrain(currentRightAngle - degrees, 0, 180);
        Serial.print("Moving RIGHT servo COUNTERCLOCKWISE by ");
        Serial.print(degrees);
        Serial.print("°: ");
        Serial.print(currentRightAngle);
        Serial.print("° → ");
        Serial.print(newAngle);
        Serial.println("°");
        
        moveRightServoSmooth(newAngle);
        currentRightAngle = newAngle;
        Serial.println("✓ Right counterclockwise movement complete");
      } else {
        Serial.println("❌ Invalid degrees! Use 1-180.");
      }
    }
    
    else if (command == "SWEEP") {
      runSweepTest();
    }
    
    else if (command == "TEST") {
      runAngleTest();
    }
    
    else if (command == "HOME") {
      Serial.println("Returning to HOME position (90°)...");
      moveBothServos(90);
      Serial.println("✓ Home position reached");
    }
    
    else if (command == "STATUS") {
      showStatus();
    }
    
    else if (command.startsWith("OPPOSITE ")) {
      // Move left clockwise and right counterclockwise: OPPOSITE <degrees>
      int degrees = command.substring(9).toInt();
      if (degrees > 0 && degrees <= 90) {
        int newLeft = constrain(currentLeftAngle + degrees, 0, 180);
        int newRight = constrain(currentRightAngle - degrees, 0, 180);
        
        Serial.print("OPPOSITE movement by ");
        Serial.print(degrees);
        Serial.println("°");
        Serial.print("Left CW: ");
        Serial.print(currentLeftAngle);
        Serial.print("° → ");
        Serial.print(newLeft);
        Serial.print("°, Right CCW: ");
        Serial.print(currentRightAngle);
        Serial.print("° → ");
        Serial.print(newRight);
        Serial.println("°");
        
        moveSyncServos(newLeft, newRight);
        Serial.println("✓ Opposite movement complete");
      } else {
        Serial.println("❌ Invalid degrees! Use 1-90.");
      }
    }
    
    else if (command.startsWith("INVERTL ")) {
      // Invert left servo direction: INVERTL <on|off>
      String param = command.substring(8);
      if (param == "ON") {
        leftServoInvert = true;
        Serial.println("Left servo inversion: ENABLED");
        Serial.println("Left servo will now rotate in opposite direction");
      } else if (param == "OFF") {
        leftServoInvert = false;
        Serial.println("Left servo inversion: DISABLED");
        Serial.println("Left servo will now rotate normally");
      } else {
        Serial.println("Usage: INVERTL ON or INVERTL OFF");
      }
    }
    
    else if (command.startsWith("INVERTR ")) {
      // Invert right servo direction: INVERTR <on|off>
      String param = command.substring(8);
      if (param == "ON") {
        rightServoInvert = true;
        Serial.println("Right servo inversion: ENABLED");
        Serial.println("Right servo will now rotate in opposite direction");
      } else if (param == "OFF") {
        rightServoInvert = false;
        Serial.println("Right servo inversion: DISABLED");
        Serial.println("Right servo will now rotate normally");
      } else {
        Serial.println("Usage: INVERTR ON or INVERTR OFF");
      }
    }
    
    else if (command == "HELP") {
      showHelp();
    }
    
    else if (command.length() > 0) {
      Serial.println("❌ Unknown command. Type HELP for available commands.");
    }
    
    // Show status after each command
    if (command.length() > 0) {
      Serial.println();
      showStatus();
      Serial.println();
    }
    
    Serial.print("> ");
  }
}

// Individual servo movement functions with inversion support
void moveLeftServoSmooth(int targetAngle) {
  targetAngle = constrain(targetAngle, 0, 180);
  
  if (targetAngle == currentLeftAngle) {
    return;
  }
  
  int direction = (targetAngle > currentLeftAngle) ? 1 : -1;
  
  for (int angle = currentLeftAngle; angle != targetAngle; angle += direction) {
    writeLeftServo(angle);
    delay(moveStepDelay);
  }
  
  writeLeftServo(targetAngle);
  currentLeftAngle = targetAngle;
  delay(100); // Extra settle time
}

void moveRightServoSmooth(int targetAngle) {
  targetAngle = constrain(targetAngle, 0, 180);
  
  if (targetAngle == currentRightAngle) {
    return;
  }
  
  int direction = (targetAngle > currentRightAngle) ? 1 : -1;
  
  for (int angle = currentRightAngle; angle != targetAngle; angle += direction) {
    writeRightServo(angle);
    delay(moveStepDelay);
  }
  
  
  writeRightServo(targetAngle);
  currentRightAngle = targetAngle;
  delay(100); // Extra settle time
}

void moveBothServos(int targetAngle) {
  targetAngle = constrain(targetAngle, 0, 180);
  
  // Calculate which servo needs to move farther
  int leftDistance = abs(targetAngle - currentLeftAngle);
  int rightDistance = abs(targetAngle - currentRightAngle);
  int maxDistance = max(leftDistance, rightDistance);
  
  if (maxDistance == 0) {
    return; // Already at target
  }
  
  // Move both servos simultaneously
  for (int step = 0; step <= maxDistance; step++) {
    // Calculate intermediate positions
    int leftPos = currentLeftAngle + ((targetAngle - currentLeftAngle) * step) / maxDistance;
    int rightPos = currentRightAngle + ((targetAngle - currentRightAngle) * step) / maxDistance;
    
    writeLeftServo(leftPos);
    writeRightServo(rightPos);
    delay(moveStepDelay);
  }
  
  // Final position
  writeLeftServo(targetAngle);
  writeRightServo(targetAngle);
  currentLeftAngle = targetAngle;
  currentRightAngle = targetAngle;
  delay(100);
}

void moveSyncServos(int leftAngle, int rightAngle) {
  leftAngle = constrain(leftAngle, 0, 180);
  rightAngle = constrain(rightAngle, 0, 180);
  
  // Calculate distances
  int leftDistance = abs(leftAngle - currentLeftAngle);
  int rightDistance = abs(rightAngle - currentRightAngle);
  int maxDistance = max(leftDistance, rightDistance);
  
  if (maxDistance == 0) {
    return;
  }
  
  // Move both servos to their respective targets simultaneously
  for (int step = 0; step <= maxDistance; step++) {
    int leftPos = currentLeftAngle + ((leftAngle - currentLeftAngle) * step) / maxDistance;
    int rightPos = currentRightAngle + ((rightAngle - currentRightAngle) * step) / maxDistance;
    
    writeLeftServo(leftPos);
    writeRightServo(rightPos);
    delay(moveStepDelay);
  }
  
  // Final positions
  writeLeftServo(leftAngle);
  writeRightServo(rightAngle);
  currentLeftAngle = leftAngle;
  currentRightAngle = rightAngle;
  delay(100);
}

void runSweepTest() {
  Serial.println("=== SWEEP TEST ===");
  Serial.println("Sweeping through full range: 0° → 180° → 0°");
  Serial.println();
  
  // Sweep up
  Serial.println("Phase 1: 0° → 180°");
  for (int angle = 0; angle <= 180; angle += 10) {
    Serial.print("Position: ");
    Serial.print(angle);
    Serial.println("°");
    moveBothServos(angle);
    delay(1000); // Pause at each position
  }
  
  Serial.println();
  Serial.println("Phase 2: 180° → 0°");
  // Sweep down
  for (int angle = 180; angle >= 0; angle -= 10) {
    Serial.print("Position: ");
    Serial.print(angle);
    Serial.println("°");
    moveBothServos(angle);
    delay(1000);
  }
  
  // Return to neutral
  Serial.println();
  Serial.println("Returning to neutral (90°)...");
  moveBothServos(90);
  
  Serial.println("✓ Sweep test complete!");
}

void runAngleTest() {
  Serial.println("=== ANGLE TEST ===");
  Serial.println("Testing common tilt positions...");
  Serial.println();
  
  int testAngles[] = {60, 75, 90, 105, 120};
  int numAngles = sizeof(testAngles) / sizeof(testAngles[0]);
  
  for (int i = 0; i < numAngles; i++) {
    int angle = testAngles[i];
    Serial.print("Testing ");
    Serial.print(angle);
    Serial.print("° - ");
    
    if (angle < 90) {
      Serial.println("(Leaning forward)");
    } else if (angle == 90) {
      Serial.println("(Neutral/upright)");
    } else {
      Serial.println("(Leaning backward)");
    }
    
    moveBothServos(angle);
    delay(3000); // Hold position for observation
  }
  
  Serial.println("✓ Angle test complete!");
  Serial.println();
  Serial.println("Which angle looked best for your tablet viewing?");
}

void showStatus() {
  Serial.println("┌─────────────────────────────────┐");
  Serial.println("│         CURRENT STATUS          │");
  Serial.println("├─────────────────────────────────┤");
  Serial.print("│ Left Servo:  ");
  Serial.print(currentLeftAngle);
  Serial.print("°");
  if (currentLeftAngle < 100) Serial.print(" ");
  if (currentLeftAngle < 10) Serial.print(" ");
  Serial.println("              │");
  
  Serial.print("Right Servo: ");
  Serial.print(currentRightAngle);
  Serial.print("°");
  if (currentRightAngle < 100) Serial.print(" ");
  if (currentRightAngle < 10) Serial.print(" ");
  Serial.println("              │");
  
  Serial.print("│ Left Invert: ");
  Serial.print(leftServoInvert ? "ON " : "OFF");
  Serial.println("               │");
  
  Serial.print("│ Right Invert:");
  Serial.print(rightServoInvert ? "ON " : "OFF");
  Serial.println("               │");
  
  Serial.print("│ Step Size:   ");
  Serial.print(stepSize);
  Serial.println("°                 │");
  
  Serial.print("│ Step Delay:  ");
  Serial.print(moveStepDelay);
  Serial.println("ms               │");
  Serial.println("└─────────────────────────────────┘");
}

void showHelp() {
  Serial.println("╔══════════════════════════════════════════════════════════╗");
  Serial.println("║                    COMMAND REFERENCE                    ║");
  Serial.println("╠══════════════════════════════════════════════════════════╣");
  Serial.println("║ ABSOLUTE POSITIONING:                                   ║");
  Serial.println("║ L <angle>       │ Move LEFT servo to angle (0-180)     ║");
  Serial.println("║ R <angle>       │ Move RIGHT servo to angle (0-180)    ║");
  Serial.println("║ B <angle>       │ Move BOTH servos to same angle       ║");
  Serial.println("║ SYNC <L> <R>    │ Move left to L, right to R           ║");
  Serial.println("║                                                          ║");
  Serial.println("║ DIRECTIONAL MOVEMENT:                                   ║");
  Serial.println("║ CW <deg>        │ Move BOTH servos clockwise by deg°   ║");
  Serial.println("║ CCW <deg>       │ Move BOTH servos counterclockwise    ║");
  Serial.println("║ LCW <deg>       │ Move LEFT servo clockwise by deg°    ║");
  Serial.println("║ LCCW <deg>      │ Move LEFT servo counterclockwise     ║");
  Serial.println("║ RCW <deg>       │ Move RIGHT servo clockwise by deg°   ║");
  Serial.println("║ RCCW <deg>      │ Move RIGHT servo counterclockwise    ║");
  Serial.println("║ OPPOSITE <deg>  │ Move left CW and right CCW by deg°   ║");
  Serial.println("║                                                          ║");
  Serial.println("║ SERVO CONFIGURATION:                                    ║");
  Serial.println("║ INVERTL <on|off>│ Invert left servo direction          ║");
  Serial.println("║ INVERTR <on|off>│ Invert right servo direction         ║");
  Serial.println("║                                                          ║");
  Serial.println("║ TESTING & INFO:                                         ║");
  Serial.println("║ SWEEP           │ Full range sweep test (0-180-0)      ║");
  Serial.println("║ TEST            │ Test common angles (60,75,90,105,120) ║");
  Serial.println("║ HOME            │ Move both servos to 90°             ║");
  Serial.println("║ STATUS          │ Show current servo positions         ║");
  Serial.println("║ HELP            │ Show this command reference          ║");
  Serial.println("╚══════════════════════════════════════════════════════════╝");
  Serial.println();
  Serial.println("💡 TIPS:");
  Serial.println("  • Start with 'TEST' to see common positions");
  Serial.println("  • Use 'SWEEP' to see full range of motion");
  Serial.println("  • Try angles 60-120° for tablet viewing");
  Serial.println("  • 90° = neutral/upright position");
  Serial.println("  • <90° = lean forward, >90° = lean backward");
}