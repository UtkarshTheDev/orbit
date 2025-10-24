import type { Server } from "node:http";
import { createBunWebSocket } from "hono/bun";
import { NODE_ENV, PORT } from "./config";
import httpServer from "./http/server";
import { cleanupOldTempFiles, ensureTempDir } from "./utils/fileUtils";
import type { WSConnection } from "./ws/connection";
import {
  cleanupConnection,
  clientRoles,
  connectionsById,
  recordPong,
  startHeartbeat,
} from "./ws/connection";
import { handleMessage } from "./ws/messageHandler";
import { removeFromQueue } from "./ws/polaroidQueue";
import { createWebSocketServer } from "./ws/server";

console.log("[Backend] Starting Orbit Backend Server");
console.log(`[Backend] Environment: ${NODE_ENV}`);
console.log(`[Backend] Port: ${PORT}`);

// Initialize temp directory for voice query feature
ensureTempDir();

// Schedule periodic cleanup of old temp files (every hour)
setInterval(() => {
  cleanupOldTempFiles();
}, 3_600_000);

const { upgradeWebSocket, websocket } = createBunWebSocket();

const wsHandler = upgradeWebSocket((c) => {
  // The server instance is passed in the context by Bun
  const server = c.env.server as ReturnType<typeof Bun.serve>;
  return {
    onOpen: (_event: Event, ws: WSConnection) => {
      ws.id = crypto.randomUUID();
      connectionsById.set(ws.id, ws);
      console.log(`[Backend] New connection ${ws.id} established`, {
        totalConnections: connectionsById.size,
      });
      (ws as any).pingInterval = startHeartbeat(ws);
      ws.send(JSON.stringify({ type: "connected", clientId: ws.id }));
    },
    onMessage: (event: MessageEvent, ws: WSConnection) => {
      const buffer = Buffer.from(
        typeof event.data === "string" ? event.data : String(event.data)
      );
      handleMessage(ws, server, buffer);
    },
    onPong: (_event: Event, ws: WSConnection) => {
      recordPong(ws);
    },
    onClose: (_event: CloseEvent, ws: WSConnection) => {
      console.log(`[Backend] Connection ${ws.id} closed`, {
        remainingConnections: connectionsById.size - 1,
      });
      if (clientRoles.get(ws.id) === "tablet") {
        (ws as any).raw.unsubscribe("tablets");
      }
      removeFromQueue(ws.id, server);
      cleanupConnection(ws, (ws as any).pingInterval);
    },
    onError: (error: Error, ws: WSConnection) => {
      console.error(`[Backend] WebSocket error on client ${ws.id}:`, error);
      if (clientRoles.get(ws.id) === "tablet") {
        (ws as any).raw.unsubscribe("tablets");
      }
      removeFromQueue(ws.id, server);
      cleanupConnection(ws, (ws as any).pingInterval);
    },
  };
});

// Register the WebSocket route on the Hono app
createWebSocketServer(httpServer, wsHandler);

// Export the server configuration for Bun to run
export default {
  port: PORT,
  // Pass the server instance to Hono's fetch handler
  fetch: (req: Request, server: Server) => httpServer.fetch(req, { server }),
  websocket,
};

console.log(
  `[Backend] Server configured for port ${PORT}. Bun will start the server.`
);
