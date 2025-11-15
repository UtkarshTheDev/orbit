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
Servo headServo; // Head servo can remain simple for this test file

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
  Serial.println("\n\n===== ESP32 Hardware Test Suite (Advanced Servo Control) =====");

  // Pin Modes
  pinMode(LED_PIN, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Attach servos
  tiltLeft.attach(TILT_LEFT_PIN);
  tiltRight.attach(TILT_RIGHT_PIN);
  headServo.attach(HEAD_PIN);

  // Set initial inversion (common for dual tilt setups)
  tiltLeft.invert = false;
  tiltRight.invert = true; 

  // Set servos to neutral position
  Serial.println("-> Moving servos to neutral and holding position.");
  tiltLeft.write(TILT_NEUTRAL);
  tiltRight.write(TILT_NEUTRAL);
  headServo.write(HEAD_NEUTRAL);
  delay(500);

  // Servos are intentionally left attached to provide holding torque.
  
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
// MOVEMENT & TEST FUNCTIONS
// ============================================ 

void rampMoveTilt(int targetAngle) {
  targetAngle = constrain(targetAngle, TILT_MIN, TILT_MAX);
  Serial.print("-> Ramping tilt move to ");
  Serial.print(targetAngle);
  Serial.println(" degrees...");

  int startAngle = tiltLeft.currentAngle;
  int step = (targetAngle > startAngle) ? 1 : -1;

  int rampDelayMs = 30;
  int staggerDelayMs = 5;

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

  Serial.println("-> Move complete.");
}

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

void testTiltSweep() {
  Serial.println("-> Testing tilt sweep (ramped).");
  rampMoveTilt(TILT_MAX);
  delay(500);
  rampMoveTilt(TILT_MIN);
  delay(500);
  rampMoveTilt(TILT_NEUTRAL);
  Serial.println("-> Tilt sweep complete.");
}

void testHead() {
  Serial.println("-> Testing HEAD servo (sweep).");
  for (int pos = HEAD_MIN; pos <= HEAD_MAX; pos += 1) {
    headServo.write(pos);
    delay(15);
  }
  for (int pos = HEAD_MAX; pos >= HEAD_MIN; pos -= 1) {
    headServo.write(pos);
    delay(15);
  }
  headServo.write(HEAD_NEUTRAL); // Return to center
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
  else if (command == "tilt sweep") {
    testTiltSweep();
  }
  else if (command.startsWith("settilt ")) { // settilt <angle>
      int angle = command.substring(8).toInt();
      rampMoveTilt(angle);
  }
  else if (command.startsWith("invertr ")) {
      String param = command.substring(8);
      param.toUpperCase();
      tiltRight.invert = (param == "ON");
      Serial.print("-> Right servo inversion set to: ");
      Serial.println(tiltRight.invert ? "ON" : "OFF");
      tiltRight.write(tiltRight.currentAngle); // Re-apply current angle with new inversion
  }
   else if (command.startsWith("invertl ")) {
      String param = command.substring(8);
      param.toUpperCase();
      tiltLeft.invert = (param == "ON");
      Serial.print("-> Left servo inversion set to: ");
      Serial.println(tiltLeft.invert ? "ON" : "OFF");
      tiltLeft.write(tiltLeft.currentAngle); // Re-apply current angle with new inversion
  }
  // HEAD SERVO TESTS
  else if (command == "head") {
    testHead();
  }
  else if (command.startsWith("sethead ")) { // sethead <angle>
    int angle = command.substring(8).toInt();
    Serial.print("-> Setting head to ");
    Serial.print(angle);
    Serial.println(" degrees.");
    headServo.write(angle);
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
  Serial.println("tilt sweep    - Sweeps tilt servos through their full range.");
  Serial.println("settilt <angle> - Ramped move to a specific tilt angle.");
  Serial.println("invertl <on|off> - Invert the LEFT servo's direction.");
  Serial.println("invertr <on|off> - Invert the RIGHT servo's direction.");
  Serial.println("\n[Head Servo Tests]");
  Serial.println("head          - Sweeps the head servo.");
  Serial.println("sethead <angle> - Sets head servo to a specific angle.");
  Serial.println("--------------------------\n");
}
