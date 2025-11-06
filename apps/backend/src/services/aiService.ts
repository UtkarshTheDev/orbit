/**
 * AI Service using Google Gemini 2.0 Flash
 */

import { GoogleGenAI } from "@google/genai";
import { AI_TIMEOUT, GOOGLE_GEMINI_API_KEY } from "../config";
import { getOrbitSystemPrompt } from "../utils/systemPrompt";

// Initialize Gemini client
let genAi: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!GOOGLE_GEMINI_API_KEY) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
  }

  if (!genAi) {
    genAi = new GoogleGenAI({ apiKey: GOOGLE_GEMINI_API_KEY });
  }

  return genAi;
}

/**
 * Generate AI response with streaming
 * @param userQuery - User's transcribed query
 * @param onChunk - Callback for each chunk of text
 * @param onSearchDetected - Optional callback when Google Search is detected
 * @returns Object containing full AI response text and search usage flag
 */
export async function generateAIResponseStream(
  userQuery: string,
  onChunk: (chunk: string) => void,
  onSearchDetected?: () => void
): Promise<{ text: string; usedSearch: boolean }> {
  try {
    console.log(
      `[AI] Generating response for query: ${userQuery.substring(0, 100)}...`
    );
    const client = getGeminiClient();

    // Get system prompt from utility
    const systemPrompt = getOrbitSystemPrompt();

    // Configure Google Search grounding tool
    const groundingTool = {
      googleSearch: {},
    };

    // Generate content with streaming using new API
    const response = await client.models.generateContentStream({
      model: "gemini-2.5-flash-lite",
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        tools: [groundingTool],
      },
    });

    let fullText = "";
    let usedSearch = false;
    let searchDetectedNotified = false;

    for await (const chunk of response) {
      // Check if Google Search was used (only notify once)
      if (
        !searchDetectedNotified &&
        chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
      ) {
        usedSearch = true;
        searchDetectedNotified = true;
        console.log("[AI] Google Search detected in response");
        if (onSearchDetected) {
          onSearchDetected();
        }
      }

      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    console.log(
      `[AI] Response generated: ${fullText.substring(0, 100)}... (Search used: ${usedSearch})`
    );
    return { text: fullText, usedSearch };
  } catch (error) {
    console.error("[AI] Generation error:", error);
    throw new Error(`Failed to generate AI response: ${error}`);
  }
}

/**
 * Generate AI response without streaming (fallback)
 * @param userQuery - User's transcribed query
 * @returns Object containing full AI response text and search usage flag
 */
export async function generateAIResponse(
  userQuery: string
): Promise<{ text: string; usedSearch: boolean }> {
  try {
    console.log(
      `[AI] Generating non-streaming response for query: ${userQuery.substring(0, 100)}...`
    );
    const client = getGeminiClient();

    // Get system prompt from utility
    const systemPrompt = getOrbitSystemPrompt();

    // Configure Google Search grounding tool
    const groundingTool = {
      googleSearch: {},
    };

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        tools: [groundingTool],
      },
    });

    const text = response.text;
    const usedSearch =
      !!response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    console.log(
      `[AI] Response generated: ${text.substring(0, 100)}... (Search used: ${usedSearch})`
    );
    return { text, usedSearch };
  } catch (error) {
    console.error("[AI] Generation error:", error);
    throw new Error(`Failed to generate AI response: ${error}`);
  }
}

/**
 * Generate AI response with timeout
 * @param userQuery - User's transcribed query
 * @param onChunk - Callback for each chunk of text
 * @param onSearchDetected - Optional callback when Google Search is detected
 * @param timeoutMs - Timeout in milliseconds
 * @returns Object containing full AI response text and search usage flag
 */
export async function generateAIResponseWithTimeout(
  userQuery: string,
  onChunk: (chunk: string) => void,
  onSearchDetected?: () => void,
  timeoutMs: number = AI_TIMEOUT
): Promise<{ text: string; usedSearch: boolean }> {
  return Promise.race([
    generateAIResponseStream(userQuery, onChunk, onSearchDetected),
    new Promise<{ text: string; usedSearch: boolean }>((_, reject) =>
      setTimeout(() => reject(new Error("AI generation timeout")), timeoutMs)
    ),
  ]);
}

/**
 * Check if Gemini AI is configured
 */
export function isAIConfigured(): boolean {
  return !!GOOGLE_GEMINI_API_KEY;
}
