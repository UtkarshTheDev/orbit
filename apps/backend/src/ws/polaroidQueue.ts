import type { WebSocket, WebSocketServer } from "ws";
import { POLAROID_QUEUE_TIMEOUT } from "../config";
import { broadcastToTablets } from "./broadcast";

const polaroidQueue = new Map<WebSocket, NodeJS.Timeout>();

function removeFromQueue(ws: WebSocket, wss: WebSocketServer) {
  console.log("[Backend] removeFromQueue called for WebSocket connection");
  if (polaroidQueue.has(ws)) {
    const timeoutId = polaroidQueue.get(ws);
    if (timeoutId) {
      clearTimeout(timeoutId);
      console.log("[Backend] Cleared timeout for WebSocket connection");
    }
    polaroidQueue.delete(ws);
    console.log(
      `[Backend] Phone removed from polaroid queue. Queue size: ${polaroidQueue.size}`
    );

    if (polaroidQueue.size === 0) {
      console.log(
        "[Backend] Queue is now empty, broadcasting polaroid_queue_empty"
      );
      broadcastToTablets(wss, { type: "polaroid_queue_empty" });
    }
  } else {
    console.log("[Backend] WebSocket not found in polaroid queue");
  }
}

function addToQueue(ws: WebSocket, wss: WebSocketServer) {
  const timeoutId = setTimeout(() => {
    console.log("[Backend] Phone timeout after 3 minutes, removing from queue");
    removeFromQueue(ws, wss);
  }, POLAROID_QUEUE_TIMEOUT);

  polaroidQueue.set(ws, timeoutId);
  console.log(
    `[Backend] Phone added to polaroid queue. Queue size: ${polaroidQueue.size}`
  );

  if (polaroidQueue.size === 1) {
    broadcastToTablets(wss, { type: "photo_booth_requested" });
  }
}

export { addToQueue, removeFromQueue, polaroidQueue };
