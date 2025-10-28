/**
 * Text Query Handler - Handles text-based queries (skips STT, goes directly to AI → TTS)
 */

import {
  generateAIResponseWithTimeout,
  isAIConfigured,
} from "../../services/aiService";
import {
  isTTSConfigured,
  textToSpeechWithTimeout,
} from "../../services/ttsService";
import type { WSConnection } from "../connection";

type TextQueryMessage = {
  type: "text_query";
  id: string;
  text: string;
  tts?: boolean;
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
 * Validate text query message
 */
function validateTextQuery(msg: unknown): msg is TextQueryMessage {
  if (typeof msg !== "object" || msg === null) {
    return false;
  }
  const message = msg as Record<string, unknown>;
  if (!message.id || typeof message.id !== "string") {
    return false;
  }
  if (!message.text || typeof message.text !== "string") {
    return false;
  }
  // tts is optional, but if present must be boolean
  if (message.tts !== undefined && typeof message.tts !== "boolean") {
    return false;
  }
  return true;
}

/**
 * Main text query handler
 */
export async function handleTextQuery(
  ws: WSConnection,
  msg: unknown
): Promise<void> {
  try {
    // Validate message structure
    if (!validateTextQuery(msg)) {
      sendError(ws, "validation", "Invalid text query message format");
      return;
    }

    const { id, text, tts = false } = msg;

    console.log(`[TextQuery] Processing query ${id}: ${text} (TTS: ${tts})`);

    // Check if services are configured
    if (!isAIConfigured()) {
      sendError(ws, "config", "AI service not configured");
      return;
    }
    // Only check TTS config if TTS is requested
    if (tts && !isTTSConfigured()) {
      sendError(ws, "config", "Text-to-speech service not configured");
      return;
    }

    // Stage 1: Received
    sendStatus(ws, "received", "Text query received");

    // Send the text as if it was transcribed (for UI consistency)
    ws.send(
      JSON.stringify({
        type: "stt_done",
        text: text,
      })
    );

    console.log(`[TextQuery] Text: ${text}`);

    // Stage 2: Thinking
    sendStatus(ws, "thinking", "Thinking about your query...");

    // Generate AI response with streaming
    let fullAiResponse = "";
    const aiResponse = await generateAIResponseWithTimeout(
      text,
      (chunk) => {
        // Send streaming chunk
        ws.send(
          JSON.stringify({
            type: "ai_stream",
            chunk,
            final: false,
          })
        );
      }
    );

    fullAiResponse = aiResponse;

    // Stage 3: AI done
    ws.send(
      JSON.stringify({
        type: "ai_done",
        text: fullAiResponse,
      })
    );

    console.log(
      `[TextQuery] AI response: ${fullAiResponse.substring(0, 100)}...`
    );

    // Stage 4: Converting to speech (only if TTS is requested)
    if (tts) {
      sendStatus(ws, "tts", "Converting to speech...");

      // Convert to speech
      const { audio, duration } = await textToSpeechWithTimeout(fullAiResponse);

      // Stage 5: TTS ready
      ws.send(
        JSON.stringify({
          type: "tts_ready",
          audio,
          duration,
        })
      );

      console.log(`[TextQuery] TTS ready: ${duration}s`);
    } else {
      console.log(`[TextQuery] TTS disabled, skipping speech conversion`);
    }

    console.log(`[TextQuery] Query ${id} completed successfully`);
  } catch (error) {
    console.error("[TextQuery] Error processing text query:", error);

    // Determine error stage
    let errorStage = "unknown";
    let errorMessage = "An error occurred processing your text query";

    if (error instanceof Error) {
      errorMessage = error.message;

      if (
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
  }
}
