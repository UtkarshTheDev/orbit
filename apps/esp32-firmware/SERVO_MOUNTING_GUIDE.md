# Servo Motor Opposite Mounting Configuration

## Problem Description
When two servo motors are mounted in opposite directions to rotate an object in the same direction, one servo needs to rotate clockwise while the other rotates counterclockwise to achieve the same mechanical movement.

## Solution
The updated code includes inversion support for both servo motors. You can configure which servos are mounted in opposite directions.

## Configuration

### In `tilt_servo_test.ino`:
```cpp
// Opposite mounting compensation
bool leftServoInvert = false;   // Set to true if left servo mounted opposite
bool rightServoInvert = true;   // Set to true if right servo mounted opposite
```

### In `robot_controller.ino`:
```cpp
// Opposite mounting compensation for tilt servos
bool leftTiltServoInvert = false;   // Set to true if left tilt servo mounted opposite
bool rightTiltServoInvert = true;   // Set to true if right tilt servo mounted opposite
```

## Serial Commands (tilt_servo_test.ino)

### Configuration Commands:
- `INVERTL ON/OFF` - Enable/disable left servo inversion
- `INVERTR ON/OFF` - Enable/disable right servo inversion

### Movement Commands:
- `OPPOSITE <degrees>` - Move left servo clockwise and right servo counterclockwise by the same amount
- `L <angle>` - Move left servo to specific angle
- `R <angle>` - Move right servo to specific angle
- `B <angle>` - Move both servos to same angle
- `CW <degrees>` - Move both servos clockwise
- `CCW <degrees>` - Move both servos counterclockwise

## Setup Process

1. **Initial Testing**: Start with both inversion flags set to `false`
2. **Test Movement**: Use `B 120` to move both servos to 120 degrees
3. **Check Direction**: Observe if the object tilts in the expected direction
4. **Configure Inversion**: 
   - If left servo moves wrong direction: `INVERTL ON`
   - If right servo moves wrong direction: `INVERTR ON`
5. **Verify**: Test `OPPOSITE 30` to ensure both servos work together correctly

## Example Usage

```
> B 90          // Move both to neutral (90°)
> OPPOSITE 30   // Left to 120°, Right to 60° - both rotating object same direction
> INVERTL ON    // If left servo was rotating wrong way
> INVERTR OFF   // If right servo direction is correct
> STATUS        // Check current settings
```

## How It Works

The inversion system works by converting logical angles to physical angles:
- **Normal**: Physical angle = Logical angle
- **Inverted**: Physical angle = 180 - Logical angle

For example, if you want both servos at logical angle 120°:
- Left servo (not inverted): Physical = 120°
- Right servo (inverted): Physical = 180 - 120 = 60°

This ensures both servos rotate the object in the same direction despite being mounted oppositely.

## Benefits

1. **Easy Configuration**: Change mounting behavior without rewiring
2. **Live Adjustment**: Test different configurations via serial commands
3. **Consistent Logic**: All commands work with logical angles (what you want the object to do)
4. **Debugging**: `STATUS` command shows current inversion settings