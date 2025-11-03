import type { Server } from "bun";
import type { BunWebSocketData } from "hono/bun";
import { clientRoles, connectionsById } from "./connection";

// Health check configuration
const BACKEND_PING_INTERVAL_MS = 45000;  // Send ping every 45s
const PING_TIMEOUT_MS = 10000;           // Expect pong within 10s
const MAX_MISSED_PINGS = 2;              // Auto-remove after 2 timeouts
const HEALTH_CHECK_INTERVAL_MS = 60000;  // Review all connections every 60s

// Per-connection health tracking
interface ConnectionHealth {
  lastPingTime: number;
  lastPongTime: number;
  missedPings: number;
  isHealthy: boolean;
}

const connectionHealth = new Map<string, ConnectionHealth>();

export function initializeConnectionHealth(clientId: string) {
  const now = Date.now();
  connectionHealth.set(clientId, {
    lastPingTime: 0,
    lastPongTime: now,
    missedPings: 0,
    isHealthy: true,
  });
}

export function removeConnectionHealth(clientId: string) {
  connectionHealth.delete(clientId);
}

export function handlePingMessage(clientId: string, server: Server<BunWebSocketData>) {
  const health = connectionHealth.get(clientId);
  if (!health) return;

  // Update last pong time (ESP32 is alive)
  health.lastPongTime = Date.now();
  health.missedPings = 0;
  health.isHealthy = true;

  // Send pong response immediately
  const connection = connectionsById.get(clientId);
  if (connection) {
    connection.send(JSON.stringify({ type: "pong" }));
  }
}

export function handlePongMessage(clientId: string) {
  const health = connectionHealth.get(clientId);
  if (!health) return;

  // ESP32 responded to our ping
  health.lastPongTime = Date.now();
  health.missedPings = 0;
  health.isHealthy = true;
}

export function sendPingToESP32(clientId: string, server: Server<BunWebSocketData>) {
  const health = connectionHealth.get(clientId);
  const connection = connectionsById.get(clientId);
  
  if (!health || !connection) return;

  // Send ping to ESP32
  health.lastPingTime = Date.now();
  connection.send(JSON.stringify({ type: "ping" }));
  
  console.log(`[Health] Sent ping to ESP32 ${clientId}`);
}

export function getConnectionHealthStats() {
  const stats = {
    total_esp32: 0,
    healthy_esp32: 0,
    unhealthy_esp32: 0,
    total_tablets: 0,
    connections: [] as any[],
  };

  // Count roles
  for (const [clientId, role] of clientRoles.entries()) {
    if (role === "esp32_sensor") {
      stats.total_esp32++;
      const health = connectionHealth.get(clientId);
      if (health?.isHealthy) {
        stats.healthy_esp32++;
      } else {
        stats.unhealthy_esp32++;
      }
    } else if (role === "tablet") {
      stats.total_tablets++;
    }

    // Add connection details
    const health = connectionHealth.get(clientId);
    stats.connections.push({
      id: clientId,
      role,
      healthy: health?.isHealthy ?? true,
      lastPongTime: health?.lastPongTime ?? null,
      missedPings: health?.missedPings ?? 0,
    });
  }

  return stats;
}

function reviewConnectionHealth(server: Server<BunWebSocketData>) {
  const now = Date.now();
  const staleConnections: string[] = [];

  for (const [clientId, health] of connectionHealth.entries()) {
    const role = clientRoles.get(clientId);
    if (role !== "esp32_sensor") continue;

    // Check if ESP32 hasn't responded to recent pings
    const timeSinceLastPong = now - health.lastPongTime;
    const expectingPong = health.lastPingTime > health.lastPongTime;

    if (expectingPong && timeSinceLastPong > PING_TIMEOUT_MS) {
      health.missedPings++;
      health.isHealthy = false;
      
      console.warn(`[Health] ESP32 ${clientId} missed ping #${health.missedPings} (last pong: ${timeSinceLastPong}ms ago)`);

      if (health.missedPings >= MAX_MISSED_PINGS) {
        console.error(`[Health] ESP32 ${clientId} is stale (${health.missedPings} missed pings), marking for removal`);
        staleConnections.push(clientId);
      }
    }
  }

  // Auto-remove stale ESP32 connections
  for (const clientId of staleConnections) {
    const connection = connectionsById.get(clientId);
    if (connection) {
      console.log(`[Health] Auto-removing stale ESP32 connection ${clientId}`);
      connection.close();
    }
  }
}

function sendPeriodicPings(server: Server<BunWebSocketData>) {
  for (const [clientId, role] of clientRoles.entries()) {
    if (role === "esp32_sensor") {
      sendPingToESP32(clientId, server);
    }
  }
}

// Start health check intervals
export function startHealthCheckSystem(server: Server<BunWebSocketData>) {
  // Send pings to all ESP32s periodically
  setInterval(() => {
    sendPeriodicPings(server);
  }, BACKEND_PING_INTERVAL_MS);

  // Review connection health and cleanup stale connections
  setInterval(() => {
    reviewConnectionHealth(server);
  }, HEALTH_CHECK_INTERVAL_MS);

  console.log("[Health] Health check system started");
}