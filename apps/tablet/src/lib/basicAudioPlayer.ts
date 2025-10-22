/**
 * Basic Audio Player
 * A simple utility for playing audio files without any complex management
 */

// Cache for audio elements to avoid recreating them
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Play a sound file
 * @param soundUrl The URL of the sound file to play
 */
export function playSound(soundUrl: string): void {
  try {
    console.log(`[BasicAudioPlayer] Playing sound: ${soundUrl}`);
    
    // Create or get cached audio element
    let audio = audioCache[soundUrl];
    
    if (!audio) {
      audio = new Audio(soundUrl);
      audioCache[soundUrl] = audio;
      
      // Preload the audio
      audio.load();
      console.log(`[BasicAudioPlayer] Created and cached audio for: ${soundUrl}`);
    }
    
    // Reset the audio to the beginning if it was already playing
    audio.currentTime = 0;
    
    // Play the sound
    const playPromise = audio.play();
    
    // Handle play errors
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error(`[BasicAudioPlayer] Error playing sound ${soundUrl}:`, error);
      });
    }
  } catch (error) {
    console.error(`[BasicAudioPlayer] Failed to play sound ${soundUrl}:`, error);
  }
}

/**
 * Preload a sound file
 * @param soundUrl The URL of the sound file to preload
 */
export function preloadSound(soundUrl: string): void {
  try {
    if (!audioCache[soundUrl]) {
      const audio = new Audio(soundUrl);
      audioCache[soundUrl] = audio;
      audio.load();
      console.log(`[BasicAudioPlayer] Preloaded sound: ${soundUrl}`);
    }
  } catch (error) {
    console.error(`[BasicAudioPlayer] Failed to preload sound ${soundUrl}:`, error);
  }
}

// Preload common sounds
if (typeof window !== 'undefined') {
  preloadSound('/audio/qr-scanned.mp3');
  preloadSound('/audio/download-polaroid.mp3');
}