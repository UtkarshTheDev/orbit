import { Hono } from "hono";

export function createWebSocketServer(app: Hono, wsHandler: any) {
	// WebSocket route
	app.get("/ws", wsHandler);
	console.log("[Backend] WebSocket route /ws registered");
}
