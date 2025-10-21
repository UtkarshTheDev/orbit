import { Hono } from "hono";
import { WebSocketServer } from "ws";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

// --- WebSocket server setup ---
const wss = new WebSocketServer({ port: 3001 });

// Helper function to remove phone from queue and check if empty
function removeFromQueue(ws) {
  if (polaroidQueue.has(ws)) {
    const timeoutId = polaroidQueue.get(ws);
    clearTimeout(timeoutId);
    polaroidQueue.delete(ws);
    console.log(
      `[Backend] Phone removed from polaroid queue. Queue size: ${polaroidQueue.size}`
    );

    // If queue becomes empty, notify tablets
    if (polaroidQueue.size === 0) {
      let broadcastCount = 0;
      for (const client of Array.from(wss.clients)) {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: "polaroid_queue_empty" }));
          broadcastCount++;
        }
      }
      console.log(
        `[Backend] polaroid_queue_empty broadcast to ${broadcastCount} client(s)`
      );
    }
  }
}

// Track connected clients with their roles
const clientRoles = new Map();
const polaroidQueue = new Map(); // Track phones in polaroid queue with their timeout timers

wss.on("connection", (ws) => {
  // connection established

  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message as unknown as string);

      if (msg.type === "identify") {
        clientRoles.set(ws, msg.role);
        console.log(`[Backend] Client identified as: ${msg.role}`);
      }

      if (msg.type === "polaroid_entered") {
        // Add phone to polaroid queue with timeout
        const timeoutId = setTimeout(
          () => {
            console.log(
              "[Backend] Phone timeout after 3 minutes, removing from queue"
            );
            removeFromQueue(ws);
          },
          3 * 60 * 1000
        ); // 3 minutes timeout

        polaroidQueue.set(ws, timeoutId);
        console.log(
          `[Backend] Phone added to polaroid queue. Queue size: ${polaroidQueue.size}`
        );

        // Only broadcast if this is the first phone in queue
        if (polaroidQueue.size === 1) {
          let broadcastCount = 0;
          for (const client of Array.from(wss.clients)) {
            if (client !== ws && client.readyState === 1) {
              client.send(JSON.stringify({ type: "photo_booth_requested" }));
              broadcastCount++;
            }
          }
          console.log(
            `[Backend] photo_booth_requested broadcast to ${broadcastCount} client(s)`
          );
        }
      }

      if (msg.type === "photo_captured") {
        // Remove phone from polaroid queue
        removeFromQueue(ws);
      }
    } catch {
      // ignore non-JSON messages
    }
  });

  ws.on("close", () => {
    // Remove from polaroid queue if it was there
    removeFromQueue(ws);
    clientRoles.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("[Backend] WebSocket error:", error);
  });

  ws.send("Connected to backend WebSocket server");
});

console.log("[Backend] WebSocket server listening on ws://localhost:3001");

export default app;
