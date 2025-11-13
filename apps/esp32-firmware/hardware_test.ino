#include <ESP32Servo.h>

// ============================================ 
// PIN DEFINITIONS (from robot_controller.ino)
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

// ============================================ 
// SERVO OBJECTS
// ============================================ 
Servo tiltLeft;
Servo tiltRight;
Servo headServo;

// ============================================ 
// TEST STATE
// ============================================ 
bool pirTestRunning = false;
bool distanceTestRunning = false;

void printHelp();
void handleSerialCommand(String command);

// ============================================ 
// SETUP
// ============================================ 
void setup() {
  Serial.begin(115200);
  while (!Serial) {
    ; // wait for serial port to connect. 
  }
  Serial.println("\n\n===== ESP32 Hardware Test Suite =====");

  // Pin Modes
  pinMode(LED_PIN, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Attach servos
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  headServo.attach(HEAD_PIN);

  // Set servos to neutral position
  tiltLeft.write(TILT_NEUTRAL);
  tiltRight.write(TILT_NEUTRAL);
  headServo.write(HEAD_NEUTRAL);
  delay(500);

  // Detach servos to save power
  tiltLeft.detach();
  tiltRight.detach();
  headServo.detach();

  digitalWrite(LED_PIN, LOW);

  printHelp();
}

// ============================================ 
// MAIN LOOP
// ============================================ 
void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    handleSerialCommand(command);
  }

  if (pirTestRunning) {
    runPirTest();
  }

  if (distanceTestRunning) {
    runDistanceTest();
  }

  delay(50); // Small delay to prevent spamming
}

// ============================================ 
// TEST FUNCTIONS
// ============================================ 

void testLed() {
  Serial.println("-> Testing LED. Should blink 5 times.");
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
  Serial.println("-> LED test complete.");
}

void runPirTest() {
  int pirState = digitalRead(PIR_PIN);
  static int lastPirState = LOW;

  if (pirState != lastPirState) {
    if (pirState == HIGH) {
      Serial.println("PIR: Motion DETECTED");
      digitalWrite(LED_PIN, HIGH);
    } else {
      Serial.println("PIR: Motion ENDED");
      digitalWrite(LED_PIN, LOW);
    }
    lastPirState = pirState;
  }
}

void runDistanceTest() {
  // Trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo pulse
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout

  if (duration > 0) {
    float distance = duration / 58.0;
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm");
  } else {
    Serial.println("Distance: Out of range / Timeout");
  }
  delay(500); // Read every half second
}

void sweepServo(Servo &servo, int minAngle, int maxAngle, int delayMs) {
  for (int pos = minAngle; pos <= maxAngle; pos += 1) {
    servo.write(pos);
    delay(delayMs);
  }
  for (int pos = maxAngle; pos >= minAngle; pos -= 1) {
    servo.write(pos);
    delay(delayMs);
  }
  servo.write((minAngle + maxAngle) / 2); // Return to center
}

void testTiltLeft() {
  Serial.println("-> Testing LEFT tilt servo (sweep).");
  tiltLeft.attach(TILT_LEFT_PIN);
  sweepServo(tiltLeft, TILT_MIN, TILT_MAX, 20);
  tiltLeft.detach();
  Serial.println("-> Left tilt test complete.");
}

void testTiltRight() {
  Serial.println("-> Testing RIGHT tilt servo (sweep).");
  tiltRight.attach(TILT_RIGHT_PIN);
  sweepServo(tiltRight, TILT_MIN, TILT_MAX, 20);
  tiltRight.detach();
  Serial.println("-> Right tilt test complete.");
}

void testTiltBoth() {
  Serial.println("-> Testing BOTH tilt servos together (sweep).");
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  for (int pos = TILT_MIN; pos <= TILT_MAX; pos += 1) {
    tiltLeft.write(pos);
    tiltRight.write(pos);
    delay(20);
  }
  for (int pos = TILT_MAX; pos >= TILT_MIN; pos -= 1) {
    tiltLeft.write(pos);
    tiltRight.write(pos);
    delay(20);
  }
  tiltLeft.write(TILT_NEUTRAL);
  tiltRight.write(TILT_NEUTRAL);
  delay(500);
  tiltLeft.detach();
  tiltRight.detach();
  Serial.println("-> Both tilt test complete.");
}

void testTiltInverted() {
  Serial.println("-> Testing tilt servos INVERTED (opposite directions).");
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  for (int pos = TILT_MIN; pos <= TILT_MAX; pos += 1) {
    tiltLeft.write(pos);
    tiltRight.write(TILT_MIN + TILT_MAX - pos); // Inverted
    delay(20);
  }
  for (int pos = TILT_MAX; pos >= TILT_MIN; pos -= 1) {
    tiltLeft.write(pos);
    tiltRight.write(TILT_MIN + TILT_MAX - pos); // Inverted
    delay(20);
  }
  tiltLeft.write(TILT_NEUTRAL);
  tiltRight.write(TILT_NEUTRAL);
  delay(500);
  tiltLeft.detach();
  tiltRight.detach();
  Serial.println("-> Inverted tilt test complete.");
}

void testHead() {
  Serial.println("-> Testing HEAD servo (sweep).");
  headServo.attach(HEAD_PIN);
  sweepServo(headServo, HEAD_MIN, HEAD_MAX, 15);
  headServo.detach();
  Serial.println("-> Head test complete.");
}

// ============================================ 
// SERIAL COMMAND HANDLER
// ============================================ 
void handleSerialCommand(String command) {
  command.toLowerCase();
  Serial.print("Received command: ");
  Serial.println(command);

  // Stop continuous tests if a new command is received
  pirTestRunning = false;
  distanceTestRunning = false;
  digitalWrite(LED_PIN, LOW); // Turn off LED from PIR test

  if (command == "help") {
    printHelp();
  }
  // BASIC TESTS
  else if (command == "led") {
    testLed();
  }
  // SENSOR TESTS
  else if (command == "pir") {
    Serial.println("-> Starting PIR sensor test. Wave hand in front of sensor.");
    Serial.println("   Type any command to stop.");
    pirTestRunning = true;
  }
  else if (command == "distance") {
    Serial.println("-> Starting Ultrasonic distance test. Point sensor at objects.");
    Serial.println("   Type any command to stop.");
    distanceTestRunning = true;
  }
  // TILT SERVO TESTS
  else if (command == "tilt left") {
    testTiltLeft();
  }
  else if (command == "tilt right") {
    testTiltRight();
  }
  else if (command == "tilt both") {
    testTiltBoth();
  }
  else if (command == "tilt inverted") {
    testTiltInverted();
  }
  else if (command.startsWith("settilt inverted")) { // settilt inverted <angle>
    int firstSpace = command.indexOf(' ');
    int angle = command.substring(firstSpace + 1 + String("inverted").length() + 1).toInt();
    Serial.print("-> Setting inverted tilt to ");
    Serial.print(angle);
    Serial.println(" degrees (left normal, right inverted).");
    tiltLeft.attach(TILT_LEFT_PIN);
    tiltRight.attach(TILT_RIGHT_PIN);
    tiltLeft.write(angle);
    tiltRight.write(TILT_MIN + TILT_MAX - angle); // Inverted
    delay(500);
    tiltLeft.detach();
    tiltRight.detach();
  }
  else if (command.startsWith("settilt")) { // settilt <left|right|both> <angle>
    int firstSpace = command.indexOf(' ');
    int secondSpace = command.indexOf(' ', firstSpace + 1);
    if (firstSpace != -1 && secondSpace != -1) {
      String target = command.substring(firstSpace + 1, secondSpace);
      int angle = command.substring(secondSpace + 1).toInt();
      Serial.print("-> Setting ");
      Serial.print(target);
      Serial.print(" to ");
      Serial.print(angle);
      Serial.println(" degrees.");
      if (target == "left") {
        tiltLeft.attach(TILT_LEFT_PIN);
        tiltLeft.write(angle);
        delay(500);
        tiltLeft.detach();
      } else if (target == "right") {
        tiltRight.attach(TILT_RIGHT_PIN);
        tiltRight.write(angle);
        delay(500);
        tiltRight.detach();
      } else if (target == "both") {
        tiltLeft.attach(TILT_LEFT_PIN);
        tiltRight.attach(TILT_RIGHT_PIN);
        tiltLeft.write(angle);
        tiltRight.write(angle);
        delay(500);
        tiltLeft.detach();
        tiltRight.detach();
      } else {
        Serial.println("   Invalid target. Use 'left', 'right', 'both'.");
      }
    } else {
      Serial.println("   Invalid format. Use: settilt <left|right|both> <angle>");
    }
  }
  // HEAD SERVO TESTS
  else if (command == "head") {
    testHead();
  }
  else if (command.startsWith("sethead")) { // sethead <angle>
    int angle = command.substring(7).toInt();
    Serial.print("-> Setting head to ");
    Serial.print(angle);
    Serial.println(" degrees.");
    headServo.attach(HEAD_PIN);
    headServo.write(angle);
    delay(500);
    headServo.detach();
  }
  else {
    Serial.println("-> Unknown command. Type 'help' for a list of commands.");
  }
}

void printHelp() {
  Serial.println("\n--- Available Commands ---");
  Serial.println("help          - Shows this help message.");
  Serial.println("\n[Basic Tests]");
  Serial.println("led           - Blinks the onboard LED.");
  Serial.println("\n[Sensor Tests (Continuous)]");
  Serial.println("pir           - Monitors the PIR motion sensor.");
  Serial.println("distance      - Monitors the ultrasonic distance sensor.");
  Serial.println("\n[Tilt Servo Tests]");
  Serial.println("tilt left     - Sweeps the left tilt servo.");
  Serial.println("tilt right    - Sweeps the right tilt servo.");
  Serial.println("tilt both     - Sweeps both tilt servos together.");
  Serial.println("tilt inverted - Sweeps tilt servos in opposite directions.");
  Serial.println("settilt <left|right|both|inverted> <angle> - Sets tilt servo(s) to a specific angle.");
  Serial.println("\n[Head Servo Tests]");
  Serial.println("head          - Sweeps the head servo.");
  Serial.println("sethead <angle> - Sets head servo to a specific angle.");
  Serial.println("--------------------------\n");
}
