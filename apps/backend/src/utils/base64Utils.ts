/**
 * Base64 utility functions for encoding/decoding audio data
 */

/**
 * Decode base64 string to Buffer
 */
export function decodeBase64(base64String: string): Buffer {
  try {
    // Remove data URL prefix if present (e.g., "data:audio/webm;base64,")
    const base64Data = base64String.includes(",")
      ? base64String.split(",")[1]
      : base64String;

    return Buffer.from(base64Data, "base64");
  } catch (error) {
    throw new Error(`Failed to decode base64: ${error}`);
  }
}

/**
 * Encode Buffer to base64 string
 */
export function encodeBase64(buffer: Buffer): string {
  try {
    return buffer.toString("base64");
  } catch (error) {
    throw new Error(`Failed to encode to base64: ${error}`);
  }
}

/**
 * Validate if string is valid base64
 */
export function isValidBase64(str: string): boolean {
  try {
    // Remove data URL prefix if present
    const base64Data = str.includes(",") ? str.split(",")[1] : str;
    
    // Check if string matches base64 pattern
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(base64Data)) {
      return false;
    }

    // Try to decode
    Buffer.from(base64Data, "base64");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get buffer size in bytes
 */
export function getBufferSize(buffer: Buffer): number {
  return buffer.length;
}

/**
 * Get buffer size in MB
 */
export function getBufferSizeMB(buffer: Buffer): number {
  return buffer.length / (1024 * 1024);
}
