# Voice Input & AI Response Components

This directory contains TypeScript components for voice input and AI text response with animations, converted from v0.dev.

## Components

### Main Component
- **VoiceApp.tsx** - Main voice interaction application with state management

### UI Components
- **WaveformVisualizer.tsx** - Audio waveform visualization using BarVisualizer
- **TranscriptBox.tsx** - Displays user query and AI response with markdown support
- **PillSuggestions.tsx** - Quick question suggestions as pill-shaped buttons
- **StatusText.tsx** - Shows current state (listening, analyzing, thinking)
- **AnimatedGrid.tsx** - Animated background grid effect
- **ScanLine.tsx** - Animated scan line effect
- **CornerBrackets.tsx** - Decorative corner brackets for UI elements

## ElevenLabs Components

Located in `src/components/elevenlabs/`:
- **BarVisualizer.tsx** - Canvas-based audio bar visualizer
- **Response.tsx** - Markdown renderer for AI responses
- **ShimmeringText.tsx** - Animated shimmering text effect

## Hooks

Located in `src/hooks/`:
- **useAudioAnalyzer.ts** - Hook for analyzing microphone or audio element frequency data
- **useTTS.ts** - Hook for Text-to-Speech with synthetic audio visualization

## Utilities

Located in `src/utils/`:
- **mockTimingEngine.ts** - Mock timing engine for simulating AI conversation flow

## Usage

```tsx
import { VoiceApp } from '@/components/voice'

function MyPage() {
  return <VoiceApp />
}
```

## Features

- ✅ Voice input with waveform visualization
- ✅ Real-time audio analysis
- ✅ Text-to-Speech with visual feedback
- ✅ Markdown-formatted AI responses
- ✅ Animated UI elements
- ✅ TypeScript support
- ✅ React + Vite compatible

## State Flow

1. **idle** - Waiting for user interaction
2. **listening** - Recording user voice
3. **analyzing** - Processing voice input
4. **thinking** - Generating AI response
5. **responding** - Speaking AI response with TTS
6. **done** - Conversation complete
7. **error** - Error occurred

## Notes

- All components are fully typed with TypeScript
- Components use Tailwind CSS for styling
- Audio analysis works with both microphone and audio elements
- TTS uses Web Speech API with synthetic visualization
