import type { WSConnection } from "./connection";
import { POLAROID_QUEUE_TIMEOUT } from "../config";
import { broadcastToTablets } from "./broadcast";
import type { Server } from "bun";
import type { BunWebSocketData } from "hono/bun";

// Use the client's unique ID (string) as the key
export const polaroidQueue = new Map<string, NodeJS.Timeout>();

export function removeFromQueue(clientId: string, server: Server<BunWebSocketData>) {
	console.log(`[Backend] removeFromQueue called for client ID: ${clientId}`);
	if (polaroidQueue.has(clientId)) {
		const timeoutId = polaroidQueue.get(clientId);
		if (timeoutId) {
			clearTimeout(timeoutId);
			console.log(`[Backend] Cleared timeout for client ID: ${clientId}`);
		}
		polaroidQueue.delete(clientId);
		console.log(
			`[Backend] Client removed from polaroid queue. Queue size: ${polaroidQueue.size}`,
		);

		if (polaroidQueue.size === 0) {
			console.log(
				"[Backend] Queue is now empty, broadcasting polaroid_queue_empty",
			);
			broadcastToTablets(server, { type: "polaroid_queue_empty" });
		}
	} else {
		console.log(
			`[Backend] Client ID ${clientId} not found in polaroid queue`,
		);
	}
}

export function addToQueue(ws: WSConnection, server: Server<BunWebSocketData>) {
	// If the client is already in the queue, clear the old timeout
	if (polaroidQueue.has(ws.id)) {
		clearTimeout(polaroidQueue.get(ws.id));
	}

	const timeoutId = setTimeout(() => {
		console.log(
			`[Backend] Phone timeout for ${ws.id} after 3 minutes, removing from queue`,
		);
		removeFromQueue(ws.id, server);
	}, POLAROID_QUEUE_TIMEOUT);

	polaroidQueue.set(ws.id, timeoutId);
	console.log(
		`[Backend] Client ${ws.id} added to polaroid queue. Queue size: ${polaroidQueue.size}`,
	);

	if (polaroidQueue.size === 1) {
		broadcastToTablets(server, { type: "photo_booth_requested" });
	}
}
