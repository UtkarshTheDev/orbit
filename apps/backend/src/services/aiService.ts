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
 * @returns Full AI response text
 */
export async function generateAIResponseStream(
  userQuery: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  try {
    console.log(
      `[AI] Generating response for query: ${userQuery.substring(0, 100)}...`
    );
    const client = getGeminiClient();

    // Get system prompt from utility
    const systemPrompt = getOrbitSystemPrompt();

    // Generate content with streaming using new API
    const response = await client.models.generateContentStream({
      model: "gemini-2.5-flash-lite",
      contents: userQuery,
      systemInstruction: systemPrompt,
    });

    let fullText = "";
    for await (const chunk of response) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    console.log(`[AI] Response generated: ${fullText.substring(0, 100)}...`);
    return fullText;
  } catch (error) {
    console.error("[AI] Generation error:", error);
    throw new Error(`Failed to generate AI response: ${error}`);
  }
}

/**
 * Generate AI response without streaming (fallback)
 * @param userQuery - User's transcribed query
 * @returns Full AI response text
 */
export async function generateAIResponse(userQuery: string): Promise<string> {
  try {
    console.log(
      `[AI] Generating non-streaming response for query: ${userQuery.substring(0, 100)}...`
    );
    const client = getGeminiClient();

    // Get system prompt from utility
    const systemPrompt = getOrbitSystemPrompt();

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: userQuery,
      systemInstruction: systemPrompt,
    });

    const text = response.text;

    console.log(`[AI] Response generated: ${text.substring(0, 100)}...`);
    return text;
  } catch (error) {
    console.error("[AI] Generation error:", error);
    throw new Error(`Failed to generate AI response: ${error}`);
  }
}

/**
 * Generate AI response with timeout
 * @param userQuery - User's transcribed query
 * @param onChunk - Callback for each chunk of text
 * @param timeoutMs - Timeout in milliseconds
 * @returns Full AI response text
 */
export async function generateAIResponseWithTimeout(
  userQuery: string,
  onChunk: (chunk: string) => void,
  timeoutMs: number = AI_TIMEOUT
): Promise<string> {
  return Promise.race([
    generateAIResponseStream(userQuery, onChunk),
    new Promise<string>((_, reject) =>
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
