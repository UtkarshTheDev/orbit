# ESP32 Robot Firmware

This folder contains the ESP32 firmware for the Orbit robot project.

## Current Version: Phase 3
- **PIR Motion Detection**: Detects when a person enters the area
- **Ultrasonic Distance Measurement**: Measures distance to the person
- **Tablet Tilt Control**: Adjusts tablet angle based on person's distance
- **Random Head Movement**: Scans randomly when idle

## Hardware Components
- ESP32 microcontroller
- PIR motion sensor (pin 14)
- HC-SR04 ultrasonic sensor (pins 13, 18)
- 3x servos for tilt and head movement (pins 19, 21, 23)
- LED indicator (pin 2)

## Distance Zones
- **< 50cm**: Very Close (tilt 120°)
- **50-100cm**: Close (tilt 105°)
- **100-150cm**: Viewing (tilt 95°)
- **> 150cm**: Far (neutral 90°)

## Configuration
Set `ULTRASONIC_REAL_MODE` to:
- `true` for real hardware with voltage divider
- `false` for simulation mode (testing without resistors)

## Files
- `robot_controller.ino` - Main firmware file
