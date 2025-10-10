# Audio Assets

This folder contains audio files for the Orbit greeting animation.

## Required Audio Files

### 1. welcome.wav
- **Description**: Main welcome voice greeting
- **Timing**: Plays when the greeting text starts appearing (lineIndex === 0, charIndex === 0)
- **Duration**: 2-3 seconds
- **Content**: "Welcome to LPS Eldeco" or similar greeting

## File Format Requirements
- **Format**: MP3 (compressed, good quality)
- **Sample Rate**: 44.1 kHz
- **Bitrate**: 128-192 kbps
- **Volume**: Normalized to -16 LUFS for consistent volume

## Implementation Notes
- The AudioSync component only plays the welcome sound when greeting starts
- Audio file is preloaded for better performance
- Volume level can be adjusted in the AudioSync component
- No other sound effects are included - only the welcome voice