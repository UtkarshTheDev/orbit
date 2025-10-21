import { WebSocketServer } from "ws";
import { MAX_PAYLOAD, WS_PORT } from "../config";
import { cleanupConnection, handlePong, startHeartbeat } from "./connection";
import { handleMessage } from "./messageHandler";
import { removeFromQueue } from "./polaroidQueue";

export function createWebSocketServer() {
  const wss = new WebSocketServer({
    port: WS_PORT,
    maxPayload: MAX_PAYLOAD,
    perMessageDeflate: {
      threshold: 1024,
      concurrencyLimit: 10,
      memLevel: 7,
    },
  });

  wss.on("connection", (ws) => {
    console.log("[Backend] New WebSocket connection established");

    const pingInterval = startHeartbeat(ws);

    ws.on("pong", () => handlePong(ws));
    ws.on("message", (message: Buffer) => handleMessage(ws, wss, message));

    ws.on("close", () => {
      console.log("[Backend] WebSocket connection closed");
      cleanupConnection(ws, pingInterval);
      removeFromQueue(ws, wss);
    });

    ws.on("error", (error) => {
      console.error("[Backend] WebSocket error:", error);
      cleanupConnection(ws, pingInterval);
    });

    ws.send(JSON.stringify({ type: "connected", timestamp: Date.now() }));
  });

  console.log(
    `[Backend] WebSocket server listening on ws://localhost:${WS_PORT}`
  );

  return wss;
}
