import type { WSConnection } from "./connection";
import { clientRoles } from "./connection";
import type { Server } from "bun";

export function broadcastToTablets(server: Server, message: object) {
  const messageStr = JSON.stringify(message);
  const broadcastCount = server.publish("tablets", messageStr);
  console.log(
    `[Backend] Broadcast to ${broadcastCount} tablet(s):`,
    (message as { type: string }).type
  );
}
