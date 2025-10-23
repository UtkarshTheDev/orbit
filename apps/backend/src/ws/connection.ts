import { PING_INTERVAL } from "../config";

// Use a more specific WebSocket type that includes our custom `id` property
export type WSConnection = any & { id: string };

// --- State Maps ---
// Use a stable client ID (string) as the key instead of the WebSocket object
export const clientRoles = new Map<string, string>();
export const connectionHealth = new Map<string, number>();
// Map to find a WebSocket connection by its ID
export const connectionsById = new Map<string, WSConnection>();

export function startHeartbeat(ws: WSConnection) {
	const pingInterval = setInterval(() => {
		// If the connection is gone, stop the pinger
		if (!connectionsById.has(ws.id)) {
			clearInterval(pingInterval);
			return;
		}

		try {
			// Bun WebSocket uses ping() method
			if (typeof ws.ping === "function") {
				ws.ping();
				// Use ID as the key
				connectionHealth.set(ws.id, Date.now());
			}
		} catch (error) {
			console.error(`[Backend] Ping failed for client ${ws.id}:`, error);
			clearInterval(pingInterval);
			// Attempt to close the connection gracefully
			if (typeof ws.terminate === "function") {
				ws.terminate();
			} else if (typeof ws.close === "function") {
				ws.close();
			}
		}
	}, PING_INTERVAL);

	return pingInterval;
}

export function recordPong(ws: WSConnection) {
	// Use ID as the key
	connectionHealth.set(ws.id, Date.now());
}

export function cleanupConnection(
	ws: WSConnection,
	pingInterval?: NodeJS.Timeout,
) {
	if (pingInterval) {
		clearInterval(pingInterval);
	}
	// Clean up all state using the stable ID
	clientRoles.delete(ws.id);
	connectionHealth.delete(ws.id);
	connectionsById.delete(ws.id);
	console.log(`[Backend] Cleaned up state for client ${ws.id}`);
}
