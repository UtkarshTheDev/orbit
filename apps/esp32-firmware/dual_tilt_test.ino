/*
  Dual-Servo Tilt Mechanism Test Script for Arduino Uno

  Description:
  This script is designed to test, debug, and calibrate a dual-servo tilt platform
  using two MG90 or similar micro servos. It provides a comprehensive set of serial
  commands to control the servos individually and as a synchronized pair, allowing
  for fine-tuning of movement, load balancing, and inversion settings.

  Features:
  - Manages two servos as a single, synchronized tilt axis.
  - Implements smooth, ramped movement to prevent torque spikes and jitter.
  - Allows for on-the-fly inversion of each servo to accommodate mounting.
  - Provides a rich set of serial commands for interactive testing and debugging.
  - Includes an automated sweep function to test the full range of motion under load.

  Hardware Setup (Arduino Uno):
  - Servo 1 (Left):  Connect signal wire to Pin 9.
  - Servo 2 (Right): Connect signal wire to Pin 10.
  - Power: Connect BOTH servos to an external 5V, 2A+ power supply.
  - Ground: Create a common ground by connecting the Arduino's GND, the servos'
    GND, and the external power supply's GND together.
  - DO NOT power the servos from the Arduino's 5V pin.

  Serial Commands (send via Serial Monitor at 9600 baud):
  - HELP          - Shows this command list.
  - T <angle>     - Ramped move of both servos to a target angle (e.g., "T 120").
  - J <angle>     - Instant "jump" move of both servos (e.g., "J 45").
  - TL <angle>    - Move only the LEFT servo.
  - TR <angle>    - Move only the RIGHT servo.
  - INVERTL ON/OFF- Set inversion for the LEFT servo.
  - INVERTR ON/OFF- Set inversion for the RIGHT servo.
  - SWEEP         - Perform a slow, continuous sweep from min to max angle.
  - CENTER        - Move both servos to the neutral position (90 degrees).
  - STATUS        - Print the current angle and inversion status of both servos.
*/

#include <Servo.h>

// ============================================
// PIN & ANGLE CONFIGURATION
// ============================================
#define TILT_LEFT_PIN 9
#define TILT_RIGHT_PIN 10

#define TILT_MIN 60
#define TILT_MAX 120
#define TILT_NEUTRAL 90

// ============================================
// SERVO MANAGEMENT STRUCT
// ============================================
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
    currentAngle = angle; // Store the logical angle
  }
};

ServoMotion tiltLeft;
ServoMotion tiltRight;

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(9600);
  Serial.println("\nDual-Servo Tilt Test Initialized");
  Serial.println("---------------------------------");

  // --- Attach Servos ---
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);

  // --- Set Initial Inversion ---
  // Typically, one servo is mounted opposite the other.
  tiltLeft.invert = false;
  tiltRight.invert = true;

  // --- Move to Neutral Position ---
  Serial.println("Moving to neutral position...");
  tiltLeft.write(TILT_NEUTRAL);
  tiltRight.write(TILT_NEUTRAL);
  delay(500);

  printHelp();
  printStatus();
}

// ============================================
// MAIN LOOP - COMMAND HANDLER
// ============================================
void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();

    Serial.print(">> CMD: ");
    Serial.println(command);

    // --- PARSE AND EXECUTE ---
    if (command.startsWith("T ")) {
      int angle = command.substring(2).toInt();
      rampMoveTilt(angle);
    } else if (command.startsWith("J ")) {
      int angle = command.substring(2).toInt();
      moveInstant(angle);
    } else if (command.startsWith("TL ")) {
      int angle = command.substring(3).toInt();
      tiltLeft.write(constrain(angle, TILT_MIN, TILT_MAX));
    } else if (command.startsWith("TR ")) {
      int angle = command.substring(3).toInt();
      tiltRight.write(constrain(angle, TILT_MIN, TILT_MAX));
    } else if (command.startsWith("INVERTL ")) {
      String param = command.substring(8);
      tiltLeft.invert = (param == "ON");
      Serial.print("Left servo inversion set to: ");
      Serial.println(tiltLeft.invert ? "ON" : "OFF");
    } else if (command.startsWith("INVERTR ")) {
      String param = command.substring(8);
      tiltRight.invert = (param == "ON");
      Serial.print("Right servo inversion set to: ");
      Serial.println(tiltRight.invert ? "ON" : "OFF");
    } else if (command == "SWEEP") {
      performSweep();
    } else if (command == "CENTER") {
      rampMoveTilt(TILT_NEUTRAL);
    } else if (command == "STATUS") {
      printStatus();
    } else if (command == "HELP") {
      printHelp();
    } else if (command.length() > 0) {
      Serial.println("Unknown command. Type HELP for a list.");
    }
  }
}

// ============================================
// MOVEMENT FUNCTIONS
// ============================================

/**
 * @brief Moves both servos to a target angle with smooth ramping.
 * @param targetAngle The logical angle to move to.
 */
void rampMoveTilt(int targetAngle) {
  targetAngle = constrain(targetAngle, TILT_MIN, TILT_MAX);
  Serial.print("Ramping move to ");
  Serial.print(targetAngle);
  Serial.println(" degrees...");

  // Use the left servo's angle as the logical master angle
  int startAngle = tiltLeft.currentAngle;
  int step = (targetAngle > startAngle) ? 1 : -1;

  int rampDelayMs = 30;    // Delay between each degree of movement
  int staggerDelayMs = 5;  // Delay between commanding each servo

  for (int angle = startAngle; angle != targetAngle; angle += step) {
    tiltLeft.write(angle);
    delay(staggerDelayMs);
    tiltRight.write(angle);
    delay(rampDelayMs);
  }

  // Ensure final position is set
  tiltLeft.write(targetAngle);
  delay(staggerDelayMs);
  tiltRight.write(targetAngle);

  Serial.println("Move complete.");
  printStatus();
}

/**
 * @brief Moves both servos instantly to a target angle without ramping.
 * @param targetAngle The logical angle to move to.
 */
void moveInstant(int targetAngle) {
  targetAngle = constrain(targetAngle, TILT_MIN, TILT_MAX);
  Serial.print("Jumping to ");
  Serial.print(targetAngle);
  Serial.println(" degrees...");

  tiltLeft.write(targetAngle);
  tiltRight.write(targetAngle);

  Serial.println("Move complete.");
  printStatus();
}

/**
 * @brief Performs a full sweep from TILT_MIN to TILT_MAX and back.
 */
void performSweep() {
  Serial.println("Performing sweep...");
  delay(500);

  // Go to max
  rampMoveTilt(TILT_MAX);
  delay(1000);

  // Go to min
  rampMoveTilt(TILT_MIN);
  delay(1000);

  // Return to center
  rampMoveTilt(TILT_NEUTRAL);
  Serial.println("Sweep complete.");
}


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * @brief Prints the current status of both servos.
 */
void printStatus() {
  Serial.println("\n--- STATUS ---");
  Serial.print("Left Servo:  Angle=");
  Serial.print(tiltLeft.currentAngle);
  Serial.print(", Invert=");
  Serial.println(tiltLeft.invert ? "ON" : "OFF");

  Serial.print("Right Servo: Angle=");
  Serial.print(tiltRight.currentAngle);
  Serial.print(", Invert=");
  Serial.println(tiltRight.invert ? "ON" : "OFF");
  Serial.println("--------------");
}

/**
 * @brief Prints the help menu with all available commands.
 */
void printHelp() {
  Serial.println("\n--- Serial Commands (9600 baud) ---");
  Serial.println("  HELP          - Show this command list.");
  Serial.println("  T <angle>     - Ramped move (e.g., 'T 120').");
  Serial.println("  J <angle>     - Instant move (e.g., 'J 45').");
  Serial.println("  TL <angle>    - Move LEFT servo only.");
  Serial.println("  TR <angle>    - Move RIGHT servo only.");
  Serial.println("  INVERTL ON/OFF- Invert LEFT servo.");
  Serial.println("  INVERTR ON/OFF- Invert RIGHT servo.");
  Serial.println("  SWEEP         - Perform a full range sweep.");
  Serial.println("  CENTER        - Move to neutral (90).");
  Serial.println("  STATUS        - Show current servo status.");
  Serial.println("-------------------------------------");
}
