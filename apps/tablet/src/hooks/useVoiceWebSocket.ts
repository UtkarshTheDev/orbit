import { useCallback, useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/lib/sessionStore";

type VoiceStage = 
  | "idle"
  | "listening"
  | "uploading"
  | "analyzing"
  | "thinking"
  | "responding"
  | "done"
  | "error";

interface VoiceResponse {
  stage: VoiceStage;
  transcribedText?: string;
  aiText?: string;
  aiTextChunk?: string;
  ttsAudio?: string;
  ttsDuration?: number;
  error?: string;
}

interface UseVoiceWebSocketReturn {
  sendVoiceQuery: (audioBase64: string, format: string) => void;
  sendTextQuery: (text: string) => void;
  response: VoiceResponse;
  resetResponse: () => void;
}

/**
 * Hook to handle WebSocket communication for voice queries
 * Sends audio to backend and receives STT, AI, and TTS responses
 */
export const useVoiceWebSocket = (): UseVoiceWebSocketReturn => {
  const sendWs = useSessionStore((s) => s.sendWs);
  const ws = useSessionStore((s) => s.ws);
  const wsReady = useSessionStore((s) => s.wsReady);
  
  const [response, setResponse] = useState<VoiceResponse>({ stage: "idle" });
  const currentQueryIdRef = useRef<string | null>(null);

  // Listen to WebSocket messages
  useEffect(() => {
    if (!ws || !wsReady) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        
        // Only process voice-related messages
        if (msg.type === "status") {
          // Map backend stages to frontend stages
          const stageMap: Record<string, VoiceStage> = {
            received: "uploading",
            uploading: "uploading",
            analyzing: "analyzing",
            thinking: "thinking",
            tts: "responding",
          };
          
          const stage = stageMap[msg.stage] || "idle";
          setResponse((prev) => ({ ...prev, stage }));
          console.log(`[VoiceWS] Status: ${msg.stage} -> ${stage}`);
        } 
        else if (msg.type === "stt_done") {
          setResponse((prev) => ({
            ...prev,
            stage: "thinking",
            transcribedText: msg.text,
          }));
          console.log(`[VoiceWS] STT done: ${msg.text}`);
        }
        else if (msg.type === "ai_stream") {
          setResponse((prev) => ({
            ...prev,
            stage: "thinking",
            aiTextChunk: msg.chunk,
            aiText: (prev.aiText || "") + msg.chunk,
          }));
          console.log(`[VoiceWS] AI stream chunk: ${msg.chunk}`);
        }
        else if (msg.type === "ai_done") {
          setResponse((prev) => ({
            ...prev,
            stage: "responding",
            aiText: msg.text,
          }));
          console.log(`[VoiceWS] AI done: ${msg.text.substring(0, 100)}...`);
        }
        else if (msg.type === "tts_ready") {
          setResponse((prev) => ({
            ...prev,
            stage: "responding",
            ttsAudio: msg.audio,
            ttsDuration: msg.duration,
          }));
          console.log(`[VoiceWS] TTS ready: ${msg.duration}s`);
        }
        else if (msg.type === "error") {
          setResponse((prev) => ({
            ...prev,
            stage: "error",
            error: msg.message || "An error occurred",
          }));
          console.error(`[VoiceWS] Error: ${msg.message}`);
        }
      } catch (err) {
        console.error("[VoiceWS] Failed to parse message:", err);
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws, wsReady]);

  const sendVoiceQuery = useCallback((audioBase64: string, format: string) => {
    if (!wsReady) {
      console.error("[VoiceWS] WebSocket not ready");
      setResponse({ stage: "error", error: "Connection not ready" });
      return;
    }

    // Generate unique ID for this query
    const queryId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentQueryIdRef.current = queryId;

    // Reset response state
    setResponse({ stage: "uploading" });

    // Extract format from base64 string if it has data URL prefix
    let audioFormat = format;
    if (audioBase64.startsWith("data:audio/")) {
      const match = audioBase64.match(/data:audio\/([^;]+)/);
      if (match) {
        audioFormat = match[1];
      }
    }

    // Send voice query message
    const message = {
      type: "voice_query",
      id: queryId,
      format: audioFormat,
      data: audioBase64,
    };

    console.log(`[VoiceWS] Sending voice query: ${queryId}, format: ${audioFormat}`);
    sendWs(message);
  }, [wsReady, sendWs]);

  const sendTextQuery = useCallback((text: string) => {
    if (!wsReady) {
      console.error("[VoiceWS] WebSocket not ready");
      setResponse({ stage: "error", error: "Connection not ready" });
      return;
    }

    // Generate unique ID for this query
    const queryId = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentQueryIdRef.current = queryId;

    // Reset response state
    setResponse({ stage: "thinking" });

    // Send text query message
    const message = {
      type: "text_query",
      id: queryId,
      text: text,
    };

    console.log(`[VoiceWS] Sending text query: ${queryId}, text: ${text}`);
    sendWs(message);
  }, [wsReady, sendWs]);

  const resetResponse = useCallback(() => {
    setResponse({ stage: "idle" });
    currentQueryIdRef.current = null;
  }, []);

  return {
    sendVoiceQuery,
    sendTextQuery,
    response,
    resetResponse,
  };
};
