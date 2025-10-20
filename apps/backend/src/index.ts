import { Hono } from "hono";
import { WebSocketServer } from "ws";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

// --- WebSocket server setup ---
const wss = new WebSocketServer({ port: 3001 });

// Track connected clients with their roles
const clientRoles = new Map();

wss.on("connection", (ws) => {
  // connection established

  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message as unknown as string);

      if (msg.type === "identify") {
        clientRoles.set(ws, msg.role);
      }

      if (msg.type === "polaroid_entered") {
        let broadcastCount = 0;
        for (const client of Array.from(wss.clients)) {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ type: "photo_booth_requested" }));
            broadcastCount++;
          }
        }
        // summary log
        console.log(
          `[Backend] photo_booth_requested broadcast to ${broadcastCount} client(s)`
        );
      }
    } catch {
      // ignore non-JSON messages
    }
  });

  ws.on("close", () => {
    clientRoles.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("[Backend] WebSocket error:", error);
  });

  ws.send("Connected to backend WebSocket server");
});

console.log("[Backend] WebSocket server listening on ws://localhost:3001");

export default app;
