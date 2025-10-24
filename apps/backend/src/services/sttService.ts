/**
 * Speech-to-Text Service using AssemblyAI
 */

import { AssemblyAI } from "assemblyai";
import { ASSEMBLYAI_API_KEY, STT_TIMEOUT } from "../config";

// Initialize AssemblyAI client
let assemblyClient: AssemblyAI | null = null;

function getAssemblyClient(): AssemblyAI {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY is not configured");
  }

  if (!assemblyClient) {
    assemblyClient = new AssemblyAI({
      apiKey: ASSEMBLYAI_API_KEY,
    });
  }

  return assemblyClient;
}

/**
 * Transcribe audio file to text
 * @param audioFilePath - Path to the audio file
 * @returns Transcribed text
 */
export async function transcribeAudio(
  audioFilePath: string
): Promise<string> {
  try {
    console.log(`[STT] Starting transcription for: ${audioFilePath}`);
    const client = getAssemblyClient();

    // Upload and transcribe the audio file
    const transcript = await client.transcripts.transcribe({
      audio: audioFilePath,
      language_code: "en", // Can be made configurable
    });

    // Check transcription status
    if (transcript.status === "error") {
      throw new Error(
        `Transcription failed: ${transcript.error || "Unknown error"}`
      );
    }

    if (!transcript.text) {
      throw new Error("No transcription text returned");
    }

    console.log(`[STT] Transcription completed: ${transcript.text.substring(0, 100)}...`);
    return transcript.text;
  } catch (error) {
    console.error(`[STT] Transcription error:`, error);
    throw new Error(`Failed to transcribe audio: ${error}`);
  }
}

/**
 * Transcribe audio with timeout
 * @param audioFilePath - Path to the audio file
 * @param timeoutMs - Timeout in milliseconds
 * @returns Transcribed text
 */
export async function transcribeAudioWithTimeout(
  audioFilePath: string,
  timeoutMs: number = STT_TIMEOUT
): Promise<string> {
  return Promise.race([
    transcribeAudio(audioFilePath),
    new Promise<string>((_, reject) =>
      setTimeout(
        () => reject(new Error("Transcription timeout")),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Check if AssemblyAI is configured
 */
export function isSTTConfigured(): boolean {
  return !!ASSEMBLYAI_API_KEY;
}
