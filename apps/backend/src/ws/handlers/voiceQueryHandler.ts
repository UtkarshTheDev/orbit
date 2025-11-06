/**
 * Voice Query Handler - Orchestrates STT → AI → TTS pipeline
 */

import { MAX_AUDIO_SIZE_BYTES } from "../../config";
import {
  generateAIResponseWithTimeout,
  isAIConfigured,
} from "../../services/aiService";
import {
  isSTTConfigured,
  transcribeAudioWithTimeout,
} from "../../services/sttService";
import {
  isTTSConfigured,
  textToSpeechWithTimeout,
} from "../../services/ttsService";
import {
  decodeBase64,
  getBufferSizeMB,
  isValidBase64,
} from "../../utils/base64Utils";
import {
  deleteTempFile,
  generateFilename,
  isValidAudioFormat,
  writeTempFile,
} from "../../utils/fileUtils";
import type { WSConnection } from "../connection";

type VoiceQueryMessage = {
  type: "voice_query";
  id: string;
  format: string;
  data: string;
};

/**
 * Send status message to client
 */
function sendStatus(ws: WSConnection, stage: string, message: string): void {
  ws.send(
    JSON.stringify({
      type: "status",
      stage,
      message,
    })
  );
}

/**
 * Send error message to client
 */
function sendError(
  ws: WSConnection,
  stage: string,
  message: string,
  code?: string
): void {
  ws.send(
    JSON.stringify({
      type: "error",
      stage,
      message,
      code,
    })
  );
}

/**
 * Validate voice query message
 */
function validateVoiceQuery(msg: unknown): msg is VoiceQueryMessage {
  if (typeof msg !== "object" || msg === null) {
    return false;
  }
  const message = msg as Record<string, unknown>;
  if (!message.id || typeof message.id !== "string") {
    return false;
  }
  if (!message.format || typeof message.format !== "string") {
    return false;
  }
  if (!message.data || typeof message.data !== "string") {
    return false;
  }
  return true;
}

/**
 * Main voice query handler
 */
export async function handleVoiceQuery(
  ws: WSConnection,
  msg: unknown
): Promise<void> {
  let tempFilePath: string | null = null;

  try {
    // Validate message structure
    if (!validateVoiceQuery(msg)) {
      sendError(ws, "validation", "Invalid voice query message format");
      return;
    }

    const { id, format, data } = msg;

    console.log(`[VoiceQuery] Processing query ${id} (format: ${format})`);

    // Check if services are configured
    if (!isSTTConfigured()) {
      sendError(ws, "config", "Speech-to-text service not configured");
      return;
    }
    if (!isAIConfigured()) {
      sendError(ws, "config", "AI service not configured");
      return;
    }
    if (!isTTSConfigured()) {
      sendError(ws, "config", "Text-to-speech service not configured");
      return;
    }

    // Stage 1: Received
    sendStatus(ws, "received", "Audio received");

    // Validate audio format
    if (!isValidAudioFormat(format)) {
      sendError(ws, "validation", `Unsupported audio format: ${format}`);
      return;
    }

    // Validate base64 encoding
    if (!isValidBase64(data)) {
      sendError(ws, "validation", "Invalid base64 audio data");
      return;
    }

    // Decode base64 audio
    const audioBuffer = decodeBase64(data);

    // Check file size
    const sizeMb = getBufferSizeMB(audioBuffer);
    if (audioBuffer.length > MAX_AUDIO_SIZE_BYTES) {
      sendError(
        ws,
        "validation",
        `Audio file too large: ${sizeMb.toFixed(2)}MB (max: ${MAX_AUDIO_SIZE_BYTES / (1024 * 1024)}MB)`
      );
      return;
    }

    console.log(`[VoiceQuery] Audio decoded: ${sizeMb.toFixed(2)}MB`);

    // Stage 2: Write temp file
    const filename = generateFilename(id, format);
    tempFilePath = await writeTempFile(filename, audioBuffer);

    // Stage 3: Upload to STT provider
    sendStatus(ws, "uploading", "Uploading audio to STT provider");

    // Stage 4: Analyze voice
    sendStatus(ws, "analyzing", "Analyzing your voice...");

    // Transcribe audio
    const transcribedText = await transcribeAudioWithTimeout(tempFilePath);

    // Stage 5: STT done
    ws.send(
      JSON.stringify({
        type: "stt_done",
        text: transcribedText,
      })
    );

    console.log(`[VoiceQuery] Transcription: ${transcribedText}`);

    // Stage 6: Thinking
    sendStatus(ws, "thinking", "Thinking about your query...");

    // Generate AI response with streaming
    let fullAiResponse = "";
    let usedWebSearch = false;
    const aiResponse = await generateAIResponseWithTimeout(
      transcribedText,
      (chunk) => {
        // Send streaming chunk
        ws.send(
          JSON.stringify({
            type: "ai_stream",
            chunk,
            final: false,
          })
        );
      },
      () => {
        // Callback when Google Search is detected
        console.log("[VoiceQuery] Google Search detected, notifying client");
        ws.send(
          JSON.stringify({
            type: "web_search_active",
            message: "Searching on internet...",
          })
        );
        usedWebSearch = true;
      }
    );

    fullAiResponse = aiResponse.text;
    usedWebSearch = aiResponse.usedSearch;

    // Stage 7: AI done
    ws.send(
      JSON.stringify({
        type: "ai_done",
        text: fullAiResponse,
      })
    );

    console.log(
      `[VoiceQuery] AI response: ${fullAiResponse.substring(0, 100)}...`
    );

    // Stage 8: Converting to speech
    sendStatus(ws, "tts", "Converting to speech...");

    // Convert to speech
    const { audio, duration } = await textToSpeechWithTimeout(fullAiResponse);

    // Stage 9: TTS ready
    ws.send(
      JSON.stringify({
        type: "tts_ready",
        audio,
        duration,
      })
    );

    console.log(`[VoiceQuery] TTS ready: ${duration}s`);

    // Cleanup temp file after a delay
    if (tempFilePath) {
      setTimeout(() => {
        if (tempFilePath) {
          deleteTempFile(tempFilePath);
        }
      }, 60_000); // Delete after 1 minute
    }

    console.log(`[VoiceQuery] Query ${id} completed successfully`);
  } catch (error) {
    console.error("[VoiceQuery] Error processing voice query:", error);

    // Determine error stage
    let errorStage = "unknown";
    let errorMessage = "An error occurred processing your voice query";

    if (error instanceof Error) {
      errorMessage = error.message;

      if (errorMessage.includes("transcribe") || errorMessage.includes("STT")) {
        errorStage = "analyzing";
      } else if (
        errorMessage.includes("AI") ||
        errorMessage.includes("generate")
      ) {
        errorStage = "thinking";
      } else if (
        errorMessage.includes("speech") ||
        errorMessage.includes("TTS")
      ) {
        errorStage = "tts";
      }
    }

    sendError(ws, errorStage, errorMessage);

    // Cleanup temp file on error
    if (tempFilePath) {
      deleteTempFile(tempFilePath);
    }
  }
}
