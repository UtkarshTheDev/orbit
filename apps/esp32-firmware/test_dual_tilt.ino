/*
 * SIMPLE DUAL TILT SERVO TEST
 * 
 * Quick test to verify the dual servo system works
 * Use this to test before uploading the full robot_controller.ino
 */

#include <ESP32Servo.h>

// Pin definitions
#define TILT_LEFT_PIN 19
#define TILT_RIGHT_PIN 21
#define LED_PIN 2

// Servo objects
Servo tiltLeft;
Servo tiltRight;

// Tilt angles
#define TILT_MIN 60
#define TILT_MAX 120
#define TILT_NEUTRAL 90

// Current position
int currentTiltAngle = TILT_NEUTRAL;

// Opposite mounting compensation
bool leftTiltServoInvert = false;   // Set to true if left tilt servo mounted opposite
bool rightTiltServoInvert = true;   // Set to true if right tilt servo mounted opposite

// Function to write tilt angle with inversion support
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

// Move both tilt servos simultaneously
void moveBothTiltServos(int leftTarget, int rightTarget) {
  leftTarget = constrain(leftTarget, TILT_MIN, TILT_MAX);
  rightTarget = constrain(rightTarget, TILT_MIN, TILT_MAX);
  
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  
  // Calculate distances and determine maximum steps needed
  int leftDistance = abs(leftTarget - currentTiltAngle);
  int rightDistance = abs(rightTarget - currentTiltAngle);
  int maxSteps = max(leftDistance, rightDistance);
  
  if (maxSteps == 0) {
    tiltLeft.detach();
    tiltRight.detach();
    return;
  }
  
  // Move both servos simultaneously
  for (int step = 0; step <= maxSteps; step++) {
    int leftPos = currentTiltAngle + ((leftTarget - currentTiltAngle) * step) / maxSteps;
    int rightPos = currentTiltAngle + ((rightTarget - currentTiltAngle) * step) / maxSteps;
    
    writeLeftTiltServo(leftPos);
    writeRightTiltServo(rightPos);
    delay(15);
  }
  
  // Final positions
  writeLeftTiltServo(leftTarget);
  writeRightTiltServo(rightTarget);
  currentTiltAngle = leftTarget;
  
  delay(100);
  
  tiltLeft.detach();
  tiltRight.detach();
}

void setup() {
  Serial.begin(115200);
  
  Serial.println("\n=== DUAL TILT SERVO TEST ===");
  Serial.println("Commands: T <angle>, TL <angle>, TR <angle>");
  Serial.println("          TINVERTL <on|off>, TINVERTR <on|off>");
  Serial.println("Range: 60-120 degrees");
  
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  
  // Initialize to neutral
  moveBothTiltServos(TILT_NEUTRAL, TILT_NEUTRAL);
  
  Serial.println("Ready! Current settings:");
  Serial.print("Left servo invert: ");
  Serial.println(leftTiltServoInvert ? "ON" : "OFF");
  Serial.print("Right servo invert: ");
  Serial.println(rightTiltServoInvert ? "ON" : "OFF");
  Serial.print("Current angle: ");
  Serial.println(currentTiltAngle);
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    if (command.startsWith("T ")) {
      int angle = command.substring(2).toInt();
      if (angle >= TILT_MIN && angle <= TILT_MAX) {
        Serial.print("Moving both tilt servos to: ");
        Serial.println(angle);
        moveBothTiltServos(angle, angle);
        Serial.println("✓ Movement complete");
      } else {
        Serial.print("Invalid angle! Use ");
        Serial.print(TILT_MIN);
        Serial.print("-");
        Serial.println(TILT_MAX);
      }
    }
    
    else if (command.startsWith("TL ")) {
      int angle = command.substring(3).toInt();
      if (angle >= TILT_MIN && angle <= TILT_MAX) {
        tiltLeft.attach(TILT_LEFT_PIN);
        Serial.print("Moving LEFT tilt to: ");
        Serial.println(angle);
        writeLeftTiltServo(angle);
        delay(1000);
        tiltLeft.detach();
        Serial.println("✓ Left servo moved");
      } else {
        Serial.println("Invalid angle!");
      }
    }
    
    else if (command.startsWith("TR ")) {
      int angle = command.substring(3).toInt();
      if (angle >= TILT_MIN && angle <= TILT_MAX) {
        tiltRight.attach(TILT_RIGHT_PIN);
        Serial.print("Moving RIGHT tilt to: ");
        Serial.println(angle);
        writeRightTiltServo(angle);
        delay(1000);
        tiltRight.detach();
        Serial.println("✓ Right servo moved");
      } else {
        Serial.println("Invalid angle!");
      }
    }
    
    else if (command.startsWith("TINVERTL ")) {
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
    
    else if (command.length() > 0) {
      Serial.println("Available commands:");
      Serial.println("  T <angle>  - Move both servos (60-120)");
      Serial.println("  TL <angle> - Move left servo only");
      Serial.println("  TR <angle> - Move right servo only");
      Serial.println("  TINVERTL <on|off> - Invert left servo");
      Serial.println("  TINVERTR <on|off> - Invert right servo");
    }
  }
  
  delay(10);
}