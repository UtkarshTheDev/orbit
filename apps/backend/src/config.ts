export const PING_INTERVAL = 30_000; // 30 seconds
export const PONG_TIMEOUT = 10_000; // 10 seconds
export const POLAROID_QUEUE_TIMEOUT = 3 * 60 * 1000; // 3 minutes
export const PORT = Number(process.env.PORT) || 3001; // Use PORT for Render compatibility
export const MAX_PAYLOAD = 1024 * 1024; // 1MB
export const WS_ALLOWED_ORIGINS = (
  process.env.WS_ALLOWED_ORIGINS || 
  "https://orbit-robo.vercel.app,http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const NODE_ENV = process.env.NODE_ENV || "development";

// Voice Query Feature Configuration
export const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || "";
export const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";
export const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
export const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
export const MAX_AUDIO_SIZE_MB = Number(process.env.MAX_AUDIO_SIZE_MB) || 10;
export const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;
export const TEMP_UPLOAD_DIR = process.env.TEMP_UPLOAD_DIR || "/tmp/uploads";

// Voice Query Timeouts
export const STT_TIMEOUT = 60_000; // 60 seconds for transcription
export const AI_TIMEOUT = 120_000; // 2 minutes for AI response
export const TTS_TIMEOUT = 60_000; // 60 seconds for text-to-speech

// AI Image Editing Configuration
export const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN || "";
export const IMAGE_EDIT_TIMEOUT = 120_000; // 2 minutes for image editing
export const MAX_IMAGE_SIZE_MB = 10; // Max image size for editing
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
