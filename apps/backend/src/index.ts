import { createBunWebSocket } from "hono/bun";
import { NODE_ENV, PORT } from "./config";
import httpServer from "./http/server";
import { createWebSocketServer } from "./ws/server";
import {
	clientRoles,
	cleanupConnection,
	recordPong,
	startHeartbeat,
	connectionsById,
} from "./ws/connection";
import { handleMessage } from "./ws/messageHandler";
import { polaroidQueue, removeFromQueue } from "./ws/polaroidQueue";
import type { WSConnection } from "./ws/connection";

// Graceful shutdown for hot reloading
declare global {
	// biome-ignore lint/style/noVar: Allow var for global declaration
	var serverInstance: ReturnType<typeof Bun.serve> | null;
}

// --- Aggressive Hot Reload Cleanup ---
if (globalThis.serverInstance) {
	console.log("[Backend] Hot reload detected. Cleaning up old server state...");

	// Close all known connections
	if (connectionsById && connectionsById.size > 0) {
		console.log(
			`[Backend] Closing ${connectionsById.size} old connections...`,
		);
		for (const ws of connectionsById.values()) {
			ws.close(1012, "Server restarting");
		}
	}

	// Clear all state maps
	connectionsById.clear();
	clientRoles.clear();
	polaroidQueue.clear();
	console.log("[Backend] Cleared all old connection state.");

	// Stop the server
	globalThis.serverInstance.stop(true);
	globalThis.serverInstance = null;
	console.log("[Backend] Old server stopped.");
}
// --- End Cleanup ---

console.log(`[Backend] Starting Orbit Backend Server`);
console.log(`[Backend] Environment: ${NODE_ENV}`);
console.log(`[Backend] Port: ${PORT}`);

const { upgradeWebSocket, websocket } = createBunWebSocket();

const wsHandler = upgradeWebSocket((c) => {
	const server = c.env.server as ReturnType<typeof Bun.serve>;
	return {
		onOpen: (_event: Event, ws: WSConnection) => {
			// Assign a unique ID to the connection
			ws.id = crypto.randomUUID();
			connectionsById.set(ws.id, ws);

			console.log(`[Backend] New connection ${ws.id} established`, {
				totalConnections: connectionsById.size,
			});

			(ws as any).pingInterval = startHeartbeat(ws);
			ws.send(JSON.stringify({ type: "connected", clientId: ws.id }));
		},
		onMessage: (event: MessageEvent, ws: WSConnection) => {
			const buffer = Buffer.from(
				typeof event.data === "string"
					? event.data
					: String(event.data),
			);
			handleMessage(ws, server, buffer);
		},
		onPong: (_event: Event, ws: WSConnection) => {
			recordPong(ws);
		},
		onClose: (_event: CloseEvent, ws: WSConnection) => {
			console.log(`[Backend] Connection ${ws.id} closed`, {
				remainingConnections: connectionsById.size - 1,
			});
			// The main cleanup logic
			if (clientRoles.get(ws.id) === "tablet") {
				(ws as any).raw.unsubscribe("tablets");
				console.log(
					`[Backend] Tablet ${ws.id} unsubscribed from "tablets" channel`,
				);
			}
			// Ensure removal from queue on close
			removeFromQueue(ws.id, server);
			cleanupConnection(ws, (ws as any).pingInterval);
		},
		onError: (error: Error, ws: WSConnection) => {
			console.error(`[Backend] WebSocket error on client ${ws.id}:`, error);
			// Also ensure cleanup on error
			if (clientRoles.get(ws.id) === "tablet") {
				(ws as any).raw.unsubscribe("tablets");
				console.log(
					`[Backend] Tablet ${ws.id} unsubscribed due to error`,
				);
			}
			removeFromQueue(ws.id, server);
			cleanupConnection(ws, (ws as any).pingInterval);
		},
	};
});

createWebSocketServer(httpServer, wsHandler);

const server = Bun.serve({
	port: PORT,
	fetch: (req, server) => httpServer.fetch(req, { server }),
	websocket,
});

globalThis.serverInstance = server;

console.log(`[Backend] Server running at http://localhost:${PORT}`);
console.log(`[Backend] WebSocket endpoint: ws://localhost:${PORT}/ws`);

export default httpServer;
