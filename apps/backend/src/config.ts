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
