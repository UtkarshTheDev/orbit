import type { Server } from "bun";
import type { BunWebSocketData } from "hono/bun";
import { broadcastToTablets } from "./broadcast";
import type { WSConnection } from "./connection";
import { clientRoles } from "./connection";
// Connection health tracking for ESP32
const connectionHealth = new Map<string, {
  lastPingTime: number;
  lastPongTime: number;
  missedPings: number;
  isHealthy: boolean;
}>();

function updateConnectionHealth(clientId: string, eventType: "ping" | "pong") {
  const now = Date.now();
  const health = connectionHealth.get(clientId) || {
    lastPingTime: 0,
    lastPongTime: 0,
    missedPings: 0,
    isHealthy: true
  };

  if (eventType === "ping") {
    health.lastPingTime = now;
  } else if (eventType === "pong") {
    health.lastPongTime = now;
    health.missedPings = 0;
    health.isHealthy = true;
  }

  connectionHealth.set(clientId, health);
}
import {
	handleAIEditAccept,
	handleAIEditCancel,
	handleAIEditFinalize,
	handleAIEditPrompt,
	handleStartAIEdit,
} from "./handlers/imageEditHandler";
import { handleTextQuery } from "./handlers/textQueryHandler";
import { handleVoiceQuery } from "./handlers/voiceQueryHandler";
import { addToQueue, removeFromQueue } from "./polaroidQueue";
import { streamingManager } from "./streamingManager";

export function handleMessage(
  ws: WSConnection,
  server: Server<BunWebSocketData>,
  message: Buffer
) {
  try {
    const messageStr = message.toString();
    const msg = JSON.parse(messageStr);

    switch (msg.type) {
      case "identify":
        // Use the stable ID as the key
        clientRoles.set(ws.id, msg.role);
        if (msg.role === "tablet") {
          (ws as any).raw.subscribe("tablets");
        }
        if (msg.role === "esp32_sensor") {
          const esp32Count = Array.from(clientRoles.values()).filter((r) => r === "esp32_sensor").length;
          console.log(`[Backend] ESP32 sensor identified: ${ws.id}. Total ESP32 connected: ${esp32Count}`);
        } else {
          console.log(`[Backend] Client ${ws.id} identified as: ${msg.role}`);
        }
        break;
      case "polaroid_entered":
        console.log(
          `[Backend] Client ${ws.id} entered polaroid, adding to queue`
        );
        addToQueue(ws, server);
        break;
      case "photo_captured":
        console.log(
          `[Backend] Client ${ws.id} captured photo, broadcasting sound`
        );
        broadcastToTablets(server, { type: "photo_captured_sound" });
        // Remove from queue using the stable ID
        removeFromQueue(ws.id, server);
        break;
      case "retake_needed":
        console.log(
          `[Backend] Client ${ws.id} requested retake, broadcasting to tablets`
        );
        broadcastToTablets(server, { type: "retake_photo" });
        break;
      case "motion_detected":
        if (clientRoles.get(ws.id) !== "esp32_sensor") {
          console.warn(`[Backend] Ignoring motion_detected from non-esp32 client ${ws.id}`);
          break;
        }
        console.log(`[ESP32] Motion detected from ${ws.id}`);
        broadcastToTablets(server, { type: "motion_detected" });
        break;
      case "user_passed":
        if (clientRoles.get(ws.id) !== "esp32_sensor") {
          console.warn(`[Backend] Ignoring user_passed from non-esp32 client ${ws.id}`);
          break;
        }
        console.log(`[ESP32] User passed by (from ${ws.id})`);
        broadcastToTablets(server, { type: "user_passed" });
        break;
      case "user_arrived":
        if (clientRoles.get(ws.id) !== "esp32_sensor") {
          console.warn(`[Backend] Ignoring user_arrived from non-esp32 client ${ws.id}`);
          break;
        }
        console.log(`[ESP32] User arrived near (from ${ws.id})`);
        broadcastToTablets(server, { type: "user_arrived" });
        break;
      case "ping":
        // Respond to ping with pong (for any client, but log ESP32 specifically)
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        if (clientRoles.get(ws.id) === "esp32_sensor") {
          console.log(`[Health] Received ping from ESP32 ${ws.id}`);
          updateConnectionHealth(ws.id, "ping");
        }
        break;
      case "pong":
        // Client responded to our ping
        if (clientRoles.get(ws.id) === "esp32_sensor") {
          console.log(`[Health] Received pong from ESP32 ${ws.id}`);
          updateConnectionHealth(ws.id, "pong");
        }
        break;
      case "voice_query":
        console.log(
          `[Backend] Client ${ws.id} sent voice query, processing...`
        );
        // Handle voice query asynchronously
        handleVoiceQuery(ws, msg).catch((error) => {
          console.error(
            `[Backend] Error handling voice query from ${ws.id}:`,
            error
          );
        });
        break;
      case "text_query":
        console.log(`[Backend] Client ${ws.id} sent text query, processing...`);
        // Handle text query asynchronously
        handleTextQuery(ws, msg).catch((error) => {
          console.error(
            `[Backend] Error handling text query from ${ws.id}:`,
            error
          );
        });
        break;
      case "start_ai_edit":
        console.log(
          `[Backend] Client ${ws.id} started AI image editing`
        );
        // Handle AI edit start asynchronously
        handleStartAIEdit(ws, server, msg).catch((error) => {
          console.error(
            `[Backend] Error handling AI edit start from ${ws.id}:`,
            error
          );
        });
        break;
      case "ai_edit_accept":
        console.log(
          `[Backend] Client ${ws.id} accepted AI edit session`
        );
        // Handle AI edit accept asynchronously
        handleAIEditAccept(ws, msg).catch((error) => {
          console.error(
            `[Backend] Error handling AI edit accept from ${ws.id}:`,
            error
          );
        });
        break;
      case "ai_edit_prompt":
        console.log(
          `[Backend] Client ${ws.id} sent AI edit prompt`
        );
        // Handle AI edit prompt asynchronously
        handleAIEditPrompt(ws, msg).catch((error) => {
          console.error(
            `[Backend] Error handling AI edit prompt from ${ws.id}:`,
            error
          );
        });
        break;
      case "ai_edit_finalize":
        console.log(
          `[Backend] Client ${ws.id} finalized AI edit`
        );
        // Handle AI edit finalize asynchronously
        handleAIEditFinalize(ws, msg).catch((error) => {
          console.error(
            `[Backend] Error handling AI edit finalize from ${ws.id}:`,
            error
          );
        });
        break;
      case "ai_edit_cancel":
        console.log(
          `[Backend] Client ${ws.id} cancelled AI edit`
        );
        // Handle AI edit cancel asynchronously
        handleAIEditCancel(ws, msg).catch((error) => {
          console.error(
            `[Backend] Error handling AI edit cancel from ${ws.id}:`,
            error
          );
        });
        break;
      case "stream_retransmit":
        // Handle chunk retransmission request
        if (msg.sessionId && typeof msg.sequence === "number") {
          console.log(
            `[Backend] Client ${ws.id} requested retransmit: session=${msg.sessionId}, seq=${msg.sequence}`
          );
          const success = streamingManager.retransmitChunk(
            ws,
            msg.sessionId,
            msg.sequence
          );
          if (!success) {
            console.warn(
              `[Backend] Failed to retransmit chunk for ${ws.id}`
            );
          }
        } else {
          console.warn(
            `[Backend] Invalid retransmit request from ${ws.id}`
          );
        }
        break;
      default:
        console.log(
          `[Backend] Unknown message type from ${ws.id}: ${msg.type}`
        );
        break;
    }
  } catch (error) {
    console.error(`[Backend] Error parsing message from ${ws.id}:`, error);
  }
}
