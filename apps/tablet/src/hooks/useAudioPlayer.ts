import { useCallback, useEffect, useRef, useState } from "react";

interface UseAudioPlayerReturn {
  playAudio: (base64Audio: string) => Promise<void>;
  stopAudio: () => void;
  isPlaying: boolean;
}

/**
 * Hook to handle audio playback from base64 encoded audio
 * Used for playing TTS responses from the backend
 */
export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(async (base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }

        console.log("[AudioPlayer] Creating new audio element");
        
        // Create audio element
        const audio = new Audio();
        audioRef.current = audio;

        // Set audio source first
        const audioSrc = base64Audio.startsWith("data:") 
          ? base64Audio 
          : `data:audio/mp3;base64,${base64Audio}`;
        
        audio.src = audioSrc;
        console.log("[AudioPlayer] Audio source set, length:", base64Audio.length);

        // Set up event listeners BEFORE playing
        audio.onloadeddata = () => {
          console.log("[AudioPlayer] Audio data loaded, duration:", audio.duration);
        };

        audio.onplay = () => {
          console.log("[AudioPlayer] Audio playback started");
          setIsPlaying(true);
        };

        audio.onended = () => {
          console.log("[AudioPlayer] Audio playback ended normally");
          setIsPlaying(false);
          audioRef.current = null;
          resolve();
        };

        audio.onpause = () => {
          console.log("[AudioPlayer] Audio paused");
        };

        audio.onerror = (error) => {
          console.error("[AudioPlayer] Audio playback error:", error);
          setIsPlaying(false);
          audioRef.current = null;
          reject(new Error("Failed to play audio"));
        };

        // Play audio
        console.log("[AudioPlayer] Starting playback...");
        audio.play()
          .then(() => {
            console.log("[AudioPlayer] Play promise resolved");
          })
          .catch((err) => {
            console.error("[AudioPlayer] Failed to start playback:", err);
            setIsPlaying(false);
            audioRef.current = null;
            reject(err);
          });
      } catch (err) {
        console.error("[AudioPlayer] Error setting up audio:", err);
        setIsPlaying(false);
        reject(err);
      }
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    playAudio,
    stopAudio,
    isPlaying,
  };
};
