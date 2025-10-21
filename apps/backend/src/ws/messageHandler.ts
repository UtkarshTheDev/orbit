import type { WebSocket, WebSocketServer } from "ws";
import { clientRoles } from "./connection";
import { addToQueue, removeFromQueue } from "./polaroidQueue";

export function handleMessage(ws: WebSocket, wss: WebSocketServer, message: Buffer) {
  try {
    const msg = JSON.parse(message.toString());

    switch (msg.type) {
      case "identify":
        clientRoles.set(ws, msg.role);
        console.log(`[Backend] Client identified as: ${msg.role}`);
        break;
      case "polaroid_entered":
        addToQueue(ws, wss);
        break;
      case "photo_captured":
        removeFromQueue(ws, wss);
        break;
      default:
        // unknown message type
        break;
    }
  } catch {
    // ignore non-JSON messages
  }
}
