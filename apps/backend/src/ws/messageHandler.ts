import type { Server } from "bun";
import type { BunWebSocketData } from "hono/bun";
import { broadcastToTablets } from "./broadcast";
import type { WSConnection } from "./connection";
import { clientRoles } from "./connection";
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
        console.log(`[Backend] Client ${ws.id} identified as: ${msg.role}`);
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
