import { Hono } from "hono";
import { WebSocketServer } from "ws";

// Load environment variables in development via dotenv if invoked directly
if (process.env.NODE_ENV !== "production") {
  try {
    await import("dotenv").then((dotenv) => dotenv.config());
  } catch (e) {
    // No dotenv in prod or if not installed, that's fine
  }
}

const WS_HOST = process.env.WS_HOST || "0.0.0.0";
const WS_PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001;

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

// --- WebSocket server setup ---
const wss = new WebSocketServer({ host: WS_HOST, port: WS_PORT });
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    // Echo the message back to the sender
    ws.send(`Echo from backend: ${message}`);
  });
  ws.send("Connected to backend WebSocket server");
});

console.log(
  `[backend] WebSocket server listening on ws://${WS_HOST}:${WS_PORT}`
);

export default app;
