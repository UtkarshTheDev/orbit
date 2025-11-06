# ESP32 WebSocket Sensor Client Setup

This ESP32 client connects to your Huno backend on Render and sends real-time sensor data via WebSocket.

## Features

- ✅ **WebSocket Connection**: Secure WSS connection to Render backend
- ✅ **Motion Detection**: PIR sensor detects human presence
- ✅ **Proximity Detection**: Ultrasonic sensor measures distance to user
- ✅ **Smart State Detection**: 
  - `user_arrived`: User comes near tablet (< 50cm)
  - `user_passed`: User passes by (50-100cm)
  - `motion_detected`: PIR sensor detects movement
- ✅ **Debouncing**: Prevents repeated same values (2-second debounce + 5cm threshold)
- ✅ **Auto-reconnect**: Handles WiFi and WebSocket disconnections

## Hardware Requirements

### Components
- ESP32 Development Board (any variant)
- PIR Motion Sensor (HC-SR501 or similar)
- Ultrasonic Distance Sensor (HC-SR04)
- Jumper wires
- Breadboard (optional)
- USB cable for programming

### Wiring Diagram

```
ESP32 Pin    →    Sensor
─────────────────────────────
GPIO 14      →    PIR OUT
5V           →    PIR VCC
GND          →    PIR GND

GPIO 12      →    HC-SR04 TRIG
GPIO 13      →    HC-SR04 ECHO
5V           →    HC-SR04 VCC
GND          →    HC-SR04 GND
```

**Note**: If your ESP32 is 3.3V only, use a level shifter or voltage divider for HC-SR04 ECHO pin.

## Software Requirements

### Arduino IDE Setup

1. **Install Arduino IDE**: Download from [arduino.cc](https://www.arduino.cc/en/software)

2. **Add ESP32 Board Support**:
   - Open Arduino IDE
   - Go to `File → Preferences`
   - Add this URL to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to `Tools → Board → Boards Manager`
   - Search for "esp32" and install "ESP32 by Espressif Systems"

3. **Install Required Libraries**:
   - Go to `Tools → Manage Libraries`
   - Install the following libraries:
     - **WebSockets** by Markus Sattler (v2.4.0 or later)
     - **ArduinoJson** by Benoit Blanchon (v6.21.0 or later)

### PlatformIO Setup (Alternative)

If you prefer PlatformIO:

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps = 
    links2004/WebSockets@^2.4.0
    bblanchon/ArduinoJson@^6.21.0
monitor_speed = 115200
```

## Configuration

### 1. Update WiFi Credentials

Edit `esp32_sensor_client.ino`:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. Update Backend URL

Replace with your Render backend domain:

```cpp
const char* ws_host = "your-backend.onrender.com";
const int ws_port = 443;
const char* ws_path = "/ws";
const bool use_ssl = true;
```

**Example**: If your Render URL is `https://orbit-backend-abc123.onrender.com`, use:
```cpp
const char* ws_host = "orbit-backend-abc123.onrender.com";
```

### 3. Adjust Sensor Thresholds (Optional)

Fine-tune detection based on your setup:

```cpp
const float NEAR_THRESHOLD = 50.0;      // Distance for "user arrived" (cm)
const float FAR_THRESHOLD = 100.0;      // Distance for "user passed" (cm)
const float DISTANCE_CHANGE_MIN = 5.0;  // Minimum change to register (cm)
const unsigned long DEBOUNCE_DELAY = 2000;  // State change debounce (ms)
```

### 4. Change Sensor Pins (Optional)

If using different GPIO pins:

```cpp
const int PIR_PIN = 14;
const int TRIG_PIN = 12;
const int ECHO_PIN = 13;
```

## Upload to ESP32

1. Connect ESP32 to your computer via USB
2. Open `esp32_sensor_client.ino` in Arduino IDE
3. Select your board: `Tools → Board → ESP32 Arduino → ESP32 Dev Module`
4. Select the correct port: `Tools → Port → /dev/ttyUSB0` (or COM port on Windows)
5. Click **Upload** button
6. Open Serial Monitor (`Tools → Serial Monitor`) at **115200 baud**

## Testing

### Serial Monitor Output

You should see:

```
=================================
ESP32 Sensor WebSocket Client
=================================

[SETUP] Sensor pins configured
[WiFi] Connecting to YourWiFi....
[WiFi] Connected!
[WiFi] IP Address: 192.168.1.100
[WS] Connecting to wss://your-backend.onrender.com:443/ws
[WS] Connected to server
[WS] Sent identification as esp32_sensor
[WS] Assigned Client ID: abc-123-def-456
[SENSOR] Distance: 120.45 cm | State: NONE
[SENSOR] Sent: Motion detected
[SENSOR] Distance: 45.32 cm | State: ARRIVED
[SENSOR] Sent: User arrived (distance: 45.32 cm)
```

### WebSocket Messages Sent

The ESP32 sends these JSON messages:

**1. Motion Detected:**
```json
{
  "type": "motion_detected",
  "timestamp": 12345,
  "sensor": "PIR"
}
```

**2. User Arrived:**
```json
{
  "type": "user_arrived",
  "message": "User arrived near the tablet",
  "distance": 45.5,
  "timestamp": 12345,
  "sensor": "ultrasonic"
}
```

**3. User Passed:**
```json
{
  "type": "user_passed",
  "message": "User passed by the tablet",
  "distance": 75.2,
  "timestamp": 12345,
  "sensor": "ultrasonic"
}
```

## Backend Integration

To handle these messages in your backend, add handlers to `apps/backend/src/ws/messageHandler.ts`:

```typescript
case "motion_detected":
  console.log(`[Backend] ESP32 detected motion at ${msg.timestamp}`);
  // Broadcast to tablets or handle as needed
  broadcastToTablets(server, { 
    type: "motion_alert", 
    timestamp: msg.timestamp 
  });
  break;

case "user_arrived":
  console.log(`[Backend] User arrived near tablet: ${msg.distance}cm`);
  // Trigger UI changes, start interaction flow, etc.
  broadcastToTablets(server, { 
    type: "user_near", 
    distance: msg.distance 
  });
  break;

case "user_passed":
  console.log(`[Backend] User passed by: ${msg.distance}cm`);
  // Log analytics, reset state, etc.
  break;
```

## Troubleshooting

### Connection Issues

**Problem**: ESP32 not connecting to WiFi
- Check SSID and password are correct
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check signal strength in Serial Monitor

**Problem**: WebSocket not connecting
- Verify Render backend URL (no `https://` prefix)
- Check backend is running and accessible
- Try non-SSL connection for testing: `use_ssl = false` and `ws_port = 80`

### Sensor Issues

**Problem**: Ultrasonic sensor always returns -1
- Check wiring (TRIG and ECHO pins)
- Ensure 5V power supply is stable
- Try increasing timeout: `pulseIn(ECHO_PIN, HIGH, 50000)`

**Problem**: PIR sensor constantly triggers
- Adjust sensitivity potentiometer on PIR module
- Check delay time setting on PIR module
- Ensure PIR is not facing heat sources

**Problem**: Too many duplicate messages
- Increase `DISTANCE_CHANGE_MIN` (e.g., to 10cm)
- Increase `DEBOUNCE_DELAY` (e.g., to 3000ms)
- Add moving average filter for distance readings

### Memory Issues

**Problem**: ESP32 crashes or restarts
- Reduce JSON document sizes if needed
- Ensure stable power supply (use external 5V if USB insufficient)
- Add delays in loop if processing too fast

## Advanced Configuration

### Adding Moving Average Filter

For smoother distance readings, add this before the main code:

```cpp
const int READINGS_COUNT = 5;
float distanceReadings[READINGS_COUNT];
int readingIndex = 0;

float getAverageDistance() {
  float sum = 0;
  int validCount = 0;
  for (int i = 0; i < READINGS_COUNT; i++) {
    if (distanceReadings[i] > 0) {
      sum += distanceReadings[i];
      validCount++;
    }
  }
  return validCount > 0 ? sum / validCount : -1.0;
}

// In processSensorData(), replace:
float distance = readUltrasonicDistance();
// With:
distanceReadings[readingIndex] = readUltrasonicDistance();
readingIndex = (readingIndex + 1) % READINGS_COUNT;
float distance = getAverageDistance();
```

### Enable SSL Certificate Validation

For production, add certificate validation:

```cpp
#include <WiFiClientSecure.h>

// In setup():
webSocket.setSSLClientCertKey(...);
```

## Support

For issues specific to:
- **ESP32 hardware**: Check Espressif documentation
- **WebSocket protocol**: Check your backend logs
- **Sensor behavior**: Refer to sensor datasheets

## License

Part of the Orbit project.
