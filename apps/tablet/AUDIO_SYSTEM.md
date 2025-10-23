# Audio System Documentation

## Overview
This audio system provides synchronized sound effects for the Orbit greeting animation, enhancing the user experience with audio feedback that matches the visual animation timeline.

## Architecture

### Components Created

1. **AudioSync.tsx** - Main audio synchronization component
   - Uses Howler.js for audio playback
   - Syncs audio with animation stages and text typing
   - Handles audio lifecycle (preload, play, cleanup)

2. **GreetingAnimation.tsx** - Updated to include audio sync
   - Added AudioSync component integration
   - Passes animation state to audio component
   - Maintains existing animation functionality

3. **Audio Files Structure** - `/public/audio/`
   - `welcome.mp3` - Main welcome voice greeting
   - `typing.mp3` - Character typing sound effects
   - Documentation and placeholder files

## Audio Synchronization Timeline

### Animation Flow
1. **User Click** → RobotFace starts disappearing (2 seconds)
2. **RobotFace Disappears** → GreetingAnimation appears
3. **GreetingAnimation Stages**:
   - `detecting` (1.5s): Scanning phase
   - `greeting`: Text typing animation
   - `complete`: Final display

### Audio Events
- **Stage Change to "greeting"**: Plays `welcome.mp3`
- **Each Character Typed**: Plays `typing.mp3` 
- **Stage Change to "complete"**: Ready for completion sound (optional)

## Implementation Details

### Howler.js Integration
```typescript
// Audio initialization with preloading
welcomeSoundRef.current = new Howl({
  src: ["/audio/welcome.mp3"],
  volume: 0.8,
  preload: true,
});

// Audio playback timing
useEffect(() => {
  if (stage === "greeting" && lineIndex === 0 && charIndex === 0) {
    welcomeSoundRef.current?.play();
  }
  if (charIndex > 0) {
    typingSoundRef.current?.play();
  }
}, [stage, lineIndex, charIndex]);
```

### Audio File Requirements
- **Format**: MP3
- **Sample Rate**: 44.1 kHz
- **Bitrate**: 128-192 kbps
- **Volume**: Normalized to -16 LUFS
- **File Size**: Keep under 2MB each

### Audio Content Guidelines
1. **welcome.mp3** (2-3 seconds):
   - Voice: "Welcome to LPS Eldeco"
   - Tone: Friendly, professional, welcoming
   - Style: Clear enunciation, moderate pace

2. **typing.mp3** (0.1-0.2 seconds):
   - Sound: Soft keyboard typing or sci-fi interface click
   - Volume: Subtle, not overpowering
   - Character: Should not be jarring or distracting

## Usage Instructions

### For Developers
1. **Place audio files** in `/apps/tablet/public/audio/`
2. **Replace placeholder files** with actual MP3 files
3. **Test synchronization** by running `npm run dev`
4. **Adjust timing** in AudioSync.tsx if needed

### For Content Creators
1. **Record welcome voice** with professional equipment
2. **Create typing sound** using royalty-free sound effects
3. **Ensure audio quality** matches the professional UI design
4. **Test on different devices** for consistent volume levels

## Testing and Troubleshooting

### Common Issues
1. **Audio not playing**: Check file paths and network access
2. **Timing off**: Adjust useEffect dependencies and delays
3. **Volume issues**: Normalize audio files and adjust Howler volume
4. **Browser compatibility**: Test in target browsers (Chrome, Safari, Firefox)

### Testing Checklist
- [ ] Audio files load correctly
- [ ] Welcome audio plays at the right time
- [ ] Typing sounds sync with character appearance
- [ ] No audio overlap or conflicts
- [ ] Volume is appropriate for the environment

## Future Enhancements

### Optional Audio Features
1. **Background music** during detection phase
2. **Completion sound** when greeting finishes
3. **Volume controls** for user preference
4. **Audio accessibility** options (mute button, captions)
5. **Multiple voice options** for different languages

### Performance Optimizations
1. **Audio compression** for faster loading
2. **Lazy loading** of audio files
3. **Audio caching** for repeated interactions
4. **Fallback audio** for unsupported formats

## File Structure
```
/apps/tablet/
├── src/
│   ├── components/
│   │   ├── GreetingAnimation.tsx    # Updated with audio sync
│   │   └── AudioSync.tsx           # New audio component
│   └── App.tsx                     # Main app (unchanged)
└── public/
    └── audio/
        ├── welcome.mp3              # Welcome voice
        ├── typing.mp3               # Typing sounds
        ├── README.md                # Audio documentation
        ├── PLACEHOLDERS.md          # Implementation guide
        ├── welcome.mp3.placeholder  # Replace with actual file
        └── typing.mp3.placeholder   # Replace with actual file
```

## Dependencies
- **Howler.js**: Already installed in package.json
- **React Hooks**: useEffect, useRef, useState
- **Framer Motion**: Existing animation library

The audio system is now fully integrated and ready for actual audio file implementation.