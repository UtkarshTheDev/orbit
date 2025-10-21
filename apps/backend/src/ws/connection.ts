import type { WebSocket } from "ws";
import { PING_INTERVAL } from "../config";

export const clientRoles = new Map<WebSocket, string>();
export const connectionHealth = new Map<WebSocket, number>();

export function startHeartbeat(ws: WebSocket) {
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
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

export function handlePong(ws: WebSocket) {
  connectionHealth.set(ws, Date.now());
}

export function cleanupConnection(ws: WebSocket, pingInterval: NodeJS.Timeout) {
  clearInterval(pingInterval);
  clientRoles.delete(ws);
  connectionHealth.delete(ws);
}
