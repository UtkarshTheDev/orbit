import { Hono } from "hono";
import { cors } from "hono/cors";
import { WS_ALLOWED_ORIGINS } from "../config";

const app = new Hono();

// CORS middleware - allow frontend origins
app.use("/*", cors({
  origin: WS_ALLOWED_ORIGINS,
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

export default app;
