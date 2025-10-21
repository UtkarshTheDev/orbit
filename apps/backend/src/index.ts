import httpServer from "./http/server";
import { createWebSocketServer } from "./ws/server";

// Start the WebSocket server
createWebSocketServer();

// Export the Hono app
export default httpServer;