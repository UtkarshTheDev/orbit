import { useCallback, useRef, useState } from "react";

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ audioBlob: Blob; audioBase64: string } | null>;
  error: string | null;
}

/**
 * Hook to handle voice recording using MediaRecorder API
 * Records audio from the microphone and returns it as a Blob and base64 string
 */
export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create MediaRecorder with webm format (widely supported)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      console.log("[VoiceRecorder] Recording started");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access microphone";
      setError(errorMessage);
      console.error("[VoiceRecorder] Error starting recording:", err);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<{ audioBlob: Blob; audioBase64: string } | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        console.warn("[VoiceRecorder] No active recording to stop");
        resolve(null);
        return;
      }

      mediaRecorder.onstop = async () => {
        console.log("[VoiceRecorder] Recording stopped");
        
        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        console.log(`[VoiceRecorder] Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          console.log(`[VoiceRecorder] Base64 conversion complete: ${base64String.length} chars`);
          
          // Clean up
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          setIsRecording(false);
          audioChunksRef.current = [];
          
          resolve({
            audioBlob,
            audioBase64: base64String,
          });
        };
        
        reader.onerror = () => {
          console.error("[VoiceRecorder] Failed to convert to base64");
          setError("Failed to process audio");
          resolve(null);
        };
        
        reader.readAsDataURL(audioBlob);
      };

      // Stop recording
      mediaRecorder.stop();
    });
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
  };
};
