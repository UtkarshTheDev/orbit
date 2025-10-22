import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { MAX_PAYLOAD, WS_PORT, WS_ALLOWED_ORIGINS } from "../config";
import { cleanupConnection, handlePong, startHeartbeat } from "./connection";
import { handleMessage } from "./messageHandler";
import { removeFromQueue } from "./polaroidQueue";
import { WebSocket } from "ws";

// Store for active WebSocket connections
const activeConnections = new Set<WebSocket>();

export function createWebSocketServer() {
  const app = new Hono();
  
  // WebSocket route with Origin check before upgrade
  const wsHandler = upgradeWebSocket((c) => {
    const origin = c.req.header("origin") || "";
    return {
      // Handle WebSocket connection open
      onOpen(ws) {
        console.log("[Backend] New WebSocket connection established", { origin });
        activeConnections.add(ws as unknown as WebSocket);

        // Start heartbeat for connection health monitoring
        const pingInterval = startHeartbeat(ws as unknown as WebSocket);
        // Store pingInterval in WebSocket for cleanup
        (ws as any).pingInterval = pingInterval;

        // Send connected message
        (ws as unknown as WebSocket).send(JSON.stringify({ type: "connected", timestamp: Date.now() }));
      },

      // Handle WebSocket messages
      onMessage(event, ws) {
        const message = event.data;
        // Handle the message using the existing handler
        if (message instanceof Buffer || typeof message === "string") {
          handleMessage(ws as unknown as WebSocket, { clients: activeConnections } as any,
            message instanceof Buffer ? message : Buffer.from(message));
        }
      },

      // Handle WebSocket pong messages
      onPong(ws: WebSocket) {
        handlePong(ws as unknown as WebSocket);
      },

      // Handle WebSocket connection close
      onClose(event, ws) {
        console.log("[Backend] WebSocket connection closed");
        const pingInterval = (ws as any).pingInterval;
        cleanupConnection(ws as unknown as WebSocket, pingInterval);
        removeFromQueue(ws as unknown as WebSocket, { clients: activeConnections } as any);
        activeConnections.delete(ws as unknown as WebSocket);
      },

      // Handle WebSocket errors
      onError(error, ws) {
        console.error("[Backend] WebSocket error:", error);
        const pingInterval = (ws as any).pingInterval;
        cleanupConnection(ws as unknown as WebSocket, pingInterval);
        activeConnections.delete(ws as unknown as WebSocket);
      },

      // Configure WebSocket options
      maxPayload: MAX_PAYLOAD,
    };
  });

  app.get("/ws", (c) => {
    const origin = c.req.header("origin") || "";
    if (!WS_ALLOWED_ORIGINS.includes(origin)) {
      return c.text("", 403);
    }
    return wsHandler(c);
  });

  // Create server
  const server = {
    port: WS_PORT,
    fetch: app.fetch,
  };
  
  console.log(`[Backend] WebSocket server listening on ws://localhost:${WS_PORT}`);
  
  // Return a compatible interface for existing code
  return {
    clients: activeConnections,
    // Add any other properties/methods needed for compatibility
  } as any;
}
