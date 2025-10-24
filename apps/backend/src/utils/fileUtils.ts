/**
 * File utility functions for managing temporary audio files
 */

import { existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { TEMP_UPLOAD_DIR } from "../config";

/**
 * Ensure temp upload directory exists
 */
export function ensureTempDir(): void {
  try {
    if (!existsSync(TEMP_UPLOAD_DIR)) {
      mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
      console.log(`[FileUtils] Created temp directory: ${TEMP_UPLOAD_DIR}`);
    }
  } catch (error) {
    console.error(`[FileUtils] Failed to create temp directory:`, error);
    throw new Error(`Failed to create temp directory: ${error}`);
  }
}

/**
 * Generate unique filename with UUID and format
 */
export function generateFilename(id: string, format: string): string {
  // Sanitize format to prevent path traversal
  const sanitizedFormat = format.replace(/[^a-zA-Z0-9]/g, "");
  return `${id}.${sanitizedFormat}`;
}

/**
 * Get full file path
 */
export function getFilePath(filename: string): string {
  return join(TEMP_UPLOAD_DIR, filename);
}

/**
 * Write buffer to temp file
 */
export async function writeTempFile(
  filename: string,
  buffer: Buffer
): Promise<string> {
  try {
    ensureTempDir();
    const filepath = getFilePath(filename);
    await Bun.write(filepath, buffer);
    console.log(`[FileUtils] Wrote temp file: ${filepath} (${buffer.length} bytes)`);
    return filepath;
  } catch (error) {
    console.error(`[FileUtils] Failed to write temp file:`, error);
    throw new Error(`Failed to write temp file: ${error}`);
  }
}

/**
 * Delete temp file
 */
export function deleteTempFile(filepath: string): void {
  try {
    if (existsSync(filepath)) {
      unlinkSync(filepath);
      console.log(`[FileUtils] Deleted temp file: ${filepath}`);
    }
  } catch (error) {
    console.error(`[FileUtils] Failed to delete temp file:`, error);
  }
}

/**
 * Delete temp file after delay (for cleanup)
 */
export function scheduleTempFileCleanup(
  filepath: string,
  delayMs: number = 3600000 // 1 hour default
): void {
  setTimeout(() => {
    deleteTempFile(filepath);
  }, delayMs);
}

/**
 * Clean up old temp files (older than TTL)
 */
export function cleanupOldTempFiles(ttlMs: number = 3600000): void {
  try {
    if (!existsSync(TEMP_UPLOAD_DIR)) {
      return;
    }

    const now = Date.now();
    const files = readdirSync(TEMP_UPLOAD_DIR);

    let deletedCount = 0;
    for (const file of files) {
      const filepath = getFilePath(file);
      const stats = statSync(filepath);
      const age = now - stats.mtimeMs;

      if (age > ttlMs) {
        deleteTempFile(filepath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[FileUtils] Cleaned up ${deletedCount} old temp files`);
    }
  } catch (error) {
    console.error(`[FileUtils] Failed to cleanup old temp files:`, error);
  }
}

/**
 * Validate audio format
 */
export function isValidAudioFormat(format: string): boolean {
  const validFormats = ["webm", "mp3", "wav", "ogg", "m4a", "flac"];
  return validFormats.includes(format.toLowerCase());
}
