import { Hono } from "hono";
import { WebSocketServer } from "ws";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

// --- WebSocket server setup ---
const wss = new WebSocketServer({ port: 3001 });
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    // Echo the message back to the sender
    ws.send(`Echo from backend: ${message}`);
  });
  ws.send("Connected to backend WebSocket server");
});

export default app;
