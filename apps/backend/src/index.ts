import { Hono } from "hono";
import { WebSocketServer } from "ws";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

// --- WebSocket server setup with optimizations ---
const wss = new WebSocketServer({
  port: 3001,
  // Performance optimizations
  maxPayload: 1024 * 1024, // 1MB max message size
  perMessageDeflate: {
    threshold: 1024, // Compress messages > 1KB
    concurrencyLimit: 10,
    memLevel: 7,
  },
});

// Connection tracking with health monitoring
const clientRoles = new Map();
const polaroidQueue = new Map();
const connectionHealth = new Map(); // Track last ping time
const PING_INTERVAL = 30_000; // 30 seconds
const PONG_TIMEOUT = 10_000; // 10 seconds

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
      broadcastToTablets({ type: "polaroid_queue_empty" });
    }
  }
}

// Optimized broadcasting - only to tablets
function broadcastToTablets(message) {
  let broadcastCount = 0;
  const messageStr = JSON.stringify(message);

  for (const client of Array.from(wss.clients)) {
    if (client.readyState === 1 && clientRoles.get(client) === "tablet") {
      try {
        client.send(messageStr);
        broadcastCount++;
      } catch (error) {
        console.error("[Backend] Failed to send to tablet:", error);
        // Remove stale connection
        client.terminate();
      }
    }
  }
  console.log(
    `[Backend] Broadcast to ${broadcastCount} tablet(s):`,
    message.type
  );
}

// Heartbeat system
function startHeartbeat(ws) {
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) {
      try {
        ws.ping();
        connectionHealth.set(ws, Date.now());
      } catch (error) {
        console.error("[Backend] Ping failed:", error);
        clearInterval(pingInterval);
        ws.terminate();
      }
    } else {
      clearInterval(pingInterval);
    }
  }, PING_INTERVAL);

  return pingInterval;
}

wss.on("connection", (ws) => {
  console.log("[Backend] New WebSocket connection established");

  // Start heartbeat for this connection
  const pingInterval = startHeartbeat(ws);

  // Handle pong responses
  ws.on("pong", () => {
    connectionHealth.set(ws, Date.now());
  });

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
          broadcastToTablets({ type: "photo_booth_requested" });
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
    console.log("[Backend] WebSocket connection closed");
    clearInterval(pingInterval);
    removeFromQueue(ws);
    clientRoles.delete(ws);
    connectionHealth.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("[Backend] WebSocket error:", error);
    clearInterval(pingInterval);
  });

  // Send welcome message
  ws.send(JSON.stringify({ type: "connected", timestamp: Date.now() }));
});

console.log("[Backend] WebSocket server listening on ws://localhost:3001");

export default app;
