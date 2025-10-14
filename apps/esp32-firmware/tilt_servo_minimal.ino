/*
 * MINIMAL TILT SERVO CONTROLLER
 * 
 * Essential commands only:
 * - L <angle>         : Move left servo to angle (0-180)
 * - R <angle>         : Move right servo to angle (0-180)
 * - BOTH <angle>      : Move both servos to same angle simultaneously
 * - OPPOSITE <deg>    : Move left CW and right CCW by degrees (simultaneous)
 * - INVERTL <on|off>  : Invert left servo direction
 * - INVERTR <on|off>  : Invert right servo direction
 * - SWEEP             : Test sweep 0° → 180° → 0°
 * - STATUS            : Show current positions
 */

#include <ESP32Servo.h>

// Pin definitions
#define TILT_LEFT_PIN 19
#define TILT_RIGHT_PIN 21
#define LED_PIN 2

// Servo objects
Servo tiltLeft;
Servo tiltRight;

// Current positions
int currentLeftAngle = 90;
int currentRightAngle = 90;

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
  
  Serial.println("\n=== MINIMAL TILT SERVO CONTROLLER ===");
  Serial.println("Commands: L <angle>, R <angle>, BOTH <angle>");
  Serial.println("          OPPOSITE <deg>, INVERTL/INVERTR <on|off>");
  Serial.println("          SWEEP, STATUS");
  
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  
  // Initialize servos
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  
  // Move to neutral
  writeLeftServo(90);
  writeRightServo(90);
  delay(1000);
  
  tiltLeft.detach();
  tiltRight.detach();
  
  Serial.println("Ready! Type commands:");
  showStatus();
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
    
    if (command.startsWith("L ")) {
      // Move left servo
      int angle = command.substring(2).toInt();
      if (angle >= 0 && angle <= 180) {
        moveLeftServo(angle);
        Serial.println("✓ Left servo moved");
      } else {
        Serial.println("❌ Invalid angle! Use 0-180");
      }
    }
    
    else if (command.startsWith("R ")) {
      // Move right servo
      int angle = command.substring(2).toInt();
      if (angle >= 0 && angle <= 180) {
        moveRightServo(angle);
        Serial.println("✓ Right servo moved");
      } else {
        Serial.println("❌ Invalid angle! Use 0-180");
      }
    }
    
    else if (command.startsWith("BOTH ")) {
      // Move both servos to same angle simultaneously
      int angle = command.substring(5).toInt();
      if (angle >= 0 && angle <= 180) {
        Serial.print("Moving BOTH servos to: ");
        Serial.print(angle);
        Serial.println("°");
        
        moveBothServos(angle, angle);
        Serial.println("✓ Both servos moved");
      } else {
        Serial.println("❌ Invalid angle! Use 0-180");
      }
    }
    
    else if (command.startsWith("OPPOSITE ")) {
      // Move left CW and right CCW simultaneously
      int degrees = command.substring(9).toInt();
      if (degrees > 0 && degrees <= 90) {
        int newLeft = constrain(currentLeftAngle + degrees, 0, 180);
        int newRight = constrain(currentRightAngle - degrees, 0, 180);
        
        Serial.print("OPPOSITE: Left +");
        Serial.print(degrees);
        Serial.print("° → ");
        Serial.print(newLeft);
        Serial.print("°, Right -");
        Serial.print(degrees);
        Serial.print("° → ");
        Serial.print(newRight);
        Serial.println("°");
        
        // Move both servos simultaneously
        moveBothServos(newLeft, newRight);
        Serial.println("✓ Opposite movement complete");
      } else {
        Serial.println("❌ Invalid degrees! Use 1-90");
      }
    }
    
    else if (command.startsWith("INVERTL ")) {
      String param = command.substring(8);
      if (param == "ON") {
        leftServoInvert = true;
        Serial.println("Left servo inversion: ENABLED");
      } else if (param == "OFF") {
        leftServoInvert = false;
        Serial.println("Left servo inversion: DISABLED");
      } else {
        Serial.println("Usage: INVERTL ON or INVERTL OFF");
      }
    }
    
    else if (command.startsWith("INVERTR ")) {
      String param = command.substring(8);
      if (param == "ON") {
        rightServoInvert = true;
        Serial.println("Right servo inversion: ENABLED");
      } else if (param == "OFF") {
        rightServoInvert = false;
        Serial.println("Right servo inversion: DISABLED");
      } else {
        Serial.println("Usage: INVERTR ON or INVERTR OFF");
      }
    }
    
    else if (command == "SWEEP") {
      runSweepTest();
    }
    
    else if (command == "STATUS") {
      showStatus();
    }
    
    else if (command.length() > 0) {
      Serial.println("❌ Unknown command");
      Serial.println("Available: L <angle>, R <angle>, BOTH <angle>");
      Serial.println("           OPPOSITE <deg>, INVERTL/INVERTR <on|off>");
      Serial.println("           SWEEP, STATUS");
    }
  }
}

void moveLeftServo(int targetAngle) {
  targetAngle = constrain(targetAngle, 0, 180);
  
  tiltLeft.attach(TILT_LEFT_PIN);
  
  Serial.print("Left: ");
  Serial.print(currentLeftAngle);
  Serial.print("° → ");
  Serial.print(targetAngle);
  Serial.println("°");
  
  // Smooth movement
  int step = (targetAngle > currentLeftAngle) ? 1 : -1;
  for (int angle = currentLeftAngle; angle != targetAngle; angle += step) {
    writeLeftServo(angle);
    delay(15);
  }
  
  writeLeftServo(targetAngle);
  currentLeftAngle = targetAngle;
  delay(100);
  
  tiltLeft.detach();
}

void moveRightServo(int targetAngle) {
  targetAngle = constrain(targetAngle, 0, 180);
  
  tiltRight.attach(TILT_RIGHT_PIN);
  
  Serial.print("Right: ");
  Serial.print(currentRightAngle);
  Serial.print("° → ");
  Serial.print(targetAngle);
  Serial.println("°");
  
  // Smooth movement
  int step = (targetAngle > currentRightAngle) ? 1 : -1;
  for (int angle = currentRightAngle; angle != targetAngle; angle += step) {
    writeRightServo(angle);
    delay(15);
  }
  
  writeRightServo(targetAngle);
  currentRightAngle = targetAngle;
  delay(100);
  
  tiltRight.detach();
}

// Move both servos simultaneously to their target angles
void moveBothServos(int leftTarget, int rightTarget) {
  leftTarget = constrain(leftTarget, 0, 180);
  rightTarget = constrain(rightTarget, 0, 180);
  
  // Attach both servos
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  
  Serial.print("Left: ");
  Serial.print(currentLeftAngle);
  Serial.print("° → ");
  Serial.print(leftTarget);
  Serial.print("°, Right: ");
  Serial.print(currentRightAngle);
  Serial.print("° → ");
  Serial.print(rightTarget);
  Serial.println("°");
  
  // Calculate distances and determine maximum steps needed
  int leftDistance = abs(leftTarget - currentLeftAngle);
  int rightDistance = abs(rightTarget - currentRightAngle);
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
    int leftPos = currentLeftAngle + ((leftTarget - currentLeftAngle) * step) / maxSteps;
    int rightPos = currentRightAngle + ((rightTarget - currentRightAngle) * step) / maxSteps;
    
    writeLeftServo(leftPos);
    writeRightServo(rightPos);
    delay(15);
  }
  
  // Final positions
  writeLeftServo(leftTarget);
  writeRightServo(rightTarget);
  currentLeftAngle = leftTarget;
  currentRightAngle = rightTarget;
  
  delay(100);
  
  // Detach both servos
  tiltLeft.detach();
  tiltRight.detach();
}

void runSweepTest() {
  Serial.println("=== SWEEP TEST ===");
  
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  
  // Sweep 0° → 180° (both servos together)
  for (int angle = 0; angle <= 180; angle += 10) {
    Serial.print("Position: ");
    Serial.println(angle);
    
    writeLeftServo(angle);
    writeRightServo(angle);
    currentLeftAngle = angle;
    currentRightAngle = angle;
    
    delay(500);
  }
  
  // Sweep 180° → 0° (both servos together)
  for (int angle = 180; angle >= 0; angle -= 10) {
    Serial.print("Position: ");
    Serial.println(angle);
    
    writeLeftServo(angle);
    writeRightServo(angle);
    currentLeftAngle = angle;
    currentRightAngle = angle;
    
    delay(500);
  }
  
  // Return to neutral
  writeLeftServo(90);
  writeRightServo(90);
  currentLeftAngle = 90;
  currentRightAngle = 90;
  
  tiltLeft.detach();
  tiltRight.detach();
  
  Serial.println("✓ Sweep test complete");
}

void showStatus() {
  Serial.println("┌─────────────────────────────┐");
  Serial.println("│       CURRENT STATUS        │");
  Serial.println("├─────────────────────────────┤");
  
  Serial.print("│ Left:  ");
  Serial.print(currentLeftAngle);
  Serial.print("° (");
  Serial.print(leftServoInvert ? "INVERTED" : "NORMAL");
  Serial.println(")   │");
  
  Serial.print("│ Right: ");
  Serial.print(currentRightAngle);
  Serial.print("° (");
  Serial.print(rightServoInvert ? "INVERTED" : "NORMAL");
  Serial.println(")  │");
  
  Serial.println("└─────────────────────────────┘");
}