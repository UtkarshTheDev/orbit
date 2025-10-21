import type { WebSocket, WebSocketServer } from "ws";
import { clientRoles } from "./connection";

export function broadcastToTablets(wss: WebSocketServer, message: object) {
  let broadcastCount = 0;
  const messageStr = JSON.stringify(message);

  for (const client of Array.from(wss.clients)) {
    if (
      client.readyState === WebSocket.OPEN &&
      clientRoles.get(client) === "tablet"
    ) {
      try {
        client.send(messageStr);
        broadcastCount++;
      } catch (error) {
        console.error("[Backend] Failed to send to tablet:", error);
        client.terminate();
      }
    }
  }
  console.log(
    `[Backend] Broadcast to ${broadcastCount} tablet(s):`,
    (message as { type: string }).type
  );
}
