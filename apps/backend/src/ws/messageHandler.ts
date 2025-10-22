import type { WebSocket, WebSocketServer } from "ws";
import { broadcastToTablets } from "./broadcast";
import { clientRoles } from "./connection";
import { addToQueue, removeFromQueue } from "./polaroidQueue";

export function handleMessage(
  ws: WebSocket,
  wss: WebSocketServer,
  message: Buffer
) {
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
        // Notify tablets that a photo was captured (for sound)
        console.log(
          "[Backend] Photo captured, broadcasting photo_captured_sound to tablets"
        );
        broadcastToTablets(wss, { type: "photo_captured_sound" });
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
