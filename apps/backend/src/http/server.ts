import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { WS_ALLOWED_ORIGINS } from "../config";

const app = new Hono();

// Logging middleware
app.use('*', logger());

// CORS middleware - allow frontend origins
app.use("/*", cors({
  origin: (origin) => {
    // Allow requests with no origin (like ESP32 clients or curl)
    if (!origin) {
      return origin;
    }
    // Check if the origin is in the allowed list from config
    if (WS_ALLOWED_ORIGINS.includes(origin)) {
      return origin;
    }
    // Deny other origins
    return "";
  },
  credentials: true,
}));

// Health check endpoint
app.get("/", (c) => c.json({ 
  status: "ok", 
  message: "Orbit Backend Server",
  timestamp: Date.now(),
}));

// Health check for monitoring services
app.get("/health", (c) => c.json({ 
  status: "healthy",
  uptime: process.uptime(),
}));

// Dedicated endpoint for ESP32 test
app.get("/api/esp32", (c) => c.json({
  message: "Hello from Orbit Backend! ESP32 is connected.",
  timestamp: Date.now(),
}));

export default app;
