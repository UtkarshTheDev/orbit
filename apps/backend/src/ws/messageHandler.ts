import type { WSConnection } from "./connection";
import { broadcastToTablets } from "./broadcast";
import { clientRoles } from "./connection";
import { addToQueue, removeFromQueue } from "./polaroidQueue";
import type { Server } from "bun";
import { handleVoiceQuery } from "./handlers/voiceQueryHandler";

export function handleMessage(
	ws: WSConnection,
	server: Server,
	message: Buffer,
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
				console.log(
					`[Backend] Client ${ws.id} identified as: ${msg.role}`,
				);
				break;
			case "polaroid_entered":
				console.log(
					`[Backend] Client ${ws.id} entered polaroid, adding to queue`,
				);
				addToQueue(ws, server);
				break;
			case "photo_captured":
				console.log(
					`[Backend] Client ${ws.id} captured photo, broadcasting sound`,
				);
				broadcastToTablets(server, { type: "photo_captured_sound" });
				// Remove from queue using the stable ID
				removeFromQueue(ws.id, server);
				break;
			case "retake_needed":
				console.log(
					`[Backend] Client ${ws.id} requested retake, broadcasting to tablets`,
				);
				broadcastToTablets(server, { type: "retake_photo" });
				break;
			case "voice_query":
				console.log(
					`[Backend] Client ${ws.id} sent voice query, processing...`,
				);
				// Handle voice query asynchronously
				handleVoiceQuery(ws, msg).catch((error) => {
					console.error(
						`[Backend] Error handling voice query from ${ws.id}:`,
						error,
					);
				});
				break;
			default:
				console.log(
					`[Backend] Unknown message type from ${ws.id}: ${msg.type}`,
				);
				break;
		}
	} catch (error) {
		console.error(`[Backend] Error parsing message from ${ws.id}:`, error);
	}
}
