/**
 * Text-to-Speech Service using ElevenLabs
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import {
  ELEVENLABS_API_KEY,
  ELEVENLABS_VOICE_ID,
  TTS_TIMEOUT,
} from "../config";
import { encodeBase64 } from "../utils/base64Utils";

// Initialize ElevenLabs client
let elevenLabsClient: ElevenLabsClient | null = null;

function getElevenLabsClient(): ElevenLabsClient {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  if (!elevenLabsClient) {
    elevenLabsClient = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    });
  }

  return elevenLabsClient;
}

/**
 * Convert text to speech and return base64 encoded audio
 * @param text - Text to convert to speech
 * @returns Object with base64 audio and duration
 */
export async function textToSpeech(
  text: string
): Promise<{ audio: string; duration: number }> {
  try {
    console.log(
      `[TTS] Converting text to speech: ${text.substring(0, 100)}...`
    );
    const client = getElevenLabsClient();

    // Generate speech audio using generate method (returns async iterable)
    const audioStream = await client.textToSpeech.convert(ELEVENLABS_VOICE_ID, {
      text,
      model_id: "eleven_turbo_v2_5", // Fast, high-quality model
      output_format: "mp3_44100_128", // MP3 format, 44.1kHz, 128kbps
    });

    // Collect audio chunks
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    // Combine chunks into single buffer
    const audioBuffer = Buffer.concat(chunks);

    // Encode to base64
    const base64Audio = encodeBase64(audioBuffer);

    // Estimate duration (rough calculation based on MP3 bitrate)
    // 128kbps = 16KB/s, so duration ≈ size / 16000
    const durationSeconds = audioBuffer.length / 16_000;

    console.log(
      `[TTS] Speech generated: ${audioBuffer.length} bytes, ~${durationSeconds.toFixed(2)}s`
    );

    return {
      audio: base64Audio,
      duration: Number.parseFloat(durationSeconds.toFixed(2)),
    };
  } catch (error) {
    console.error("[TTS] Text-to-speech error:", error);
    throw new Error(`Failed to convert text to speech: ${error}`);
  }
}

/**
 * Convert text to speech with timeout
 * @param text - Text to convert to speech
 * @param timeoutMs - Timeout in milliseconds
 * @returns Object with base64 audio and duration
 */
export async function textToSpeechWithTimeout(
  text: string,
  timeoutMs: number = TTS_TIMEOUT
): Promise<{ audio: string; duration: number }> {
  return Promise.race([
    textToSpeech(text),
    new Promise<{ audio: string; duration: number }>((_, reject) =>
      setTimeout(() => reject(new Error("Text-to-speech timeout")), timeoutMs)
    ),
  ]);
}

/**
 * Check if ElevenLabs is configured
 */
export function isTTSConfigured(): boolean {
  return !!ELEVENLABS_API_KEY && !!ELEVENLABS_VOICE_ID;
}
