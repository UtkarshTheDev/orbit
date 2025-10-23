# WebSocket Implementation Guide - Hono + Bun

## Overview

This document explains the proper way to implement WebSocket with Hono and Bun based on official documentation and best practices.

## Key Concepts

### 1. createBunWebSocket()

Hono provides `createBunWebSocket()` specifically for Bun runtime. This function returns two important items:

```typescript
import { createBunWebSocket } from 'hono/bun';

const { upgradeWebSocket, websocket } = createBunWebSocket();
```

- **`upgradeWebSocket`**: A function to create WebSocket route handlers
- **`websocket`**: A WebSocket handler object for `Bun.serve()`

### 2. Server Setup

The correct pattern for setting up a Bun server with Hono and WebSocket:

```typescript
import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';

const app = new Hono();
const { upgradeWebSocket, websocket } = createBunWebSocket();

// Define WebSocket routes
app.get('/ws', upgradeWebSocket((c) => {
  return {
    onOpen(event, ws) {
      console.log('Connection opened');
    },
    onMessage(event, ws) {
      console.log('Message:', event.data);
      ws.send('Response from server');
    },
    onClose(event, ws) {
      console.log('Connection closed');
    },
    onError(event, ws) {
      console.error('Error:', event);
    }
  };
}));

// Start server with websocket handler
const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
  websocket, // CRITICAL: Must include this
});
```

## Important Points

### ✅ DO

1. **Always use `createBunWebSocket()`** for Bun runtime
2. **Pass `websocket` to `Bun.serve()`** - This is required for WebSocket to work
3. **Use `event.data`** to access message content in `onMessage`
4. **Use `ws.send()`** to send messages back to client
5. **Handle errors** in try-catch blocks

### ❌ DON'T

1. **Don't use `upgradeWebSocket` from `hono/bun` directly** - use `createBunWebSocket()` instead
2. **Don't forget the `websocket` in `Bun.serve()`** - WebSocket won't work without it
3. **Don't define custom websocket handlers in `Bun.serve()`** - let Hono handle it

## Event Handlers

### onOpen(event, ws)
Called when a WebSocket connection is established.

```typescript
onOpen(event, ws) {
  console.log('Client connected');
  ws.send(JSON.stringify({ type: 'welcome' }));
}
```

### onMessage(event, ws)
Called when a message is received from the client.

```typescript
onMessage(event, ws) {
  const message = event.data; // String or Buffer
  console.log('Received:', message);
  
  // Parse JSON if needed
  try {
    const data = JSON.parse(message);
    // Handle data
  } catch (error) {
    console.error('Invalid JSON');
  }
}
```

### onClose(event, ws)
Called when the connection is closed.

```typescript
onClose(event, ws) {
  console.log('Client disconnected');
  // Cleanup logic here
}
```

### onError(event, ws)
Called when an error occurs.

```typescript
onError(event, ws) {
  console.error('WebSocket error:', event);
}
```

## Advanced: Using Bun's ServerWebSocket

For Bun-specific features like pub/sub, access the raw WebSocket:

```typescript
import type { ServerWebSocket } from 'bun';

onOpen(event, ws) {
  const rawWs = ws.raw as ServerWebSocket;
  rawWs.subscribe('my-topic');
}

onClose(event, ws) {
  const rawWs = ws.raw as ServerWebSocket;
  rawWs.unsubscribe('my-topic');
}
```

Then use `server.publish()` to broadcast:

```typescript
server.publish('my-topic', JSON.stringify({ message: 'Hello all!' }));
```

## Our Implementation

### File Structure

```
apps/backend/src/
├── index.ts              # Main server setup
├── config.ts             # Configuration
├── http/
│   └── server.ts         # HTTP routes
└── ws/
    ├── server.ts         # WebSocket setup
    ├── connection.ts     # Connection management
    ├── messageHandler.ts # Message routing
    ├── broadcast.ts      # Broadcasting logic
    └── polaroidQueue.ts  # Queue management
```

### Key Files

#### ws/server.ts
```typescript
import { createBunWebSocket } from 'hono/bun';

const { upgradeWebSocket, websocket } = createBunWebSocket();
const activeConnections = new Set();

export function createWebSocketServer(app: Hono) {
  app.get('/ws', upgradeWebSocket((c) => {
    return {
      onOpen(event, ws) {
        activeConnections.add(ws);
        ws.send(JSON.stringify({ type: 'connected' }));
      },
      onMessage(event, ws) {
        const buffer = Buffer.from(event.data);
        handleMessage(ws, { clients: activeConnections }, buffer);
      },
      onClose(event, ws) {
        activeConnections.delete(ws);
      }
    };
  }));
  
  return { clients: activeConnections, websocket };
}

export { websocket };
```

#### index.ts
```typescript
import { createWebSocketServer, websocket } from './ws/server';

createWebSocketServer(httpServer);

const server = Bun.serve({
  port: PORT,
  fetch: httpServer.fetch,
  websocket, // Required!
});
```

## Message Flow

1. **Client connects** → `onOpen` triggered
2. **Client sends message** → `onMessage` receives `event.data`
3. **Server processes** → `handleMessage` parses and routes
4. **Server responds** → `ws.send()` sends back to client
5. **Client disconnects** → `onClose` triggered

## Debugging Tips

### Check if onMessage is called
```typescript
onMessage(event, ws) {
  console.log('✅ onMessage triggered!');
  console.log('Data:', event.data);
}
```

### Verify websocket is passed to Bun.serve
```typescript
const server = Bun.serve({
  port: PORT,
  fetch: app.fetch,
  websocket, // Make sure this is here!
});
```

### Test connection from browser console
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.send(JSON.stringify({ type: 'test' }));
```

## Common Issues

### Issue: "To enable websocket support, set the 'websocket' object"
**Solution**: Add `websocket` to `Bun.serve()` configuration

### Issue: onMessage not triggered
**Solution**: 
1. Verify `websocket` is in `Bun.serve()`
2. Check if `createBunWebSocket()` is used correctly
3. Ensure route is `/ws` and client connects to correct URL

### Issue: Messages not reaching handler
**Solution**: Check `event.data` format and parsing logic

## References

- [Hono WebSocket Helper Docs](https://hono.dev/docs/helpers/websocket)
- [Bun WebSocket API](https://bun.sh/docs/api/websockets)
- [DEV Community Tutorial](https://dev.to/yutakusuno/hono-simple-messaging-app-using-bun-and-websocket-mnk)
- [Hono GitHub - Bun WebSocket Implementation](https://github.com/honojs/hono/blob/main/src/adapter/bun/websocket.ts)

## Testing

### Local Development
```bash
# Terminal 1: Start backend
cd apps/backend
bun run dev

# Terminal 2: Start frontend
cd apps/tablet
bun run dev

# Open browser: http://localhost:5173
# Check console for WebSocket logs
```

### Production
- Backend: `wss://orbit-194b.onrender.com/ws`
- Frontend: `https://orbit-robo.vercel.app`

## Summary

The key to Hono + Bun WebSocket is:
1. Use `createBunWebSocket()` to get both `upgradeWebSocket` and `websocket`
2. Pass `websocket` to `Bun.serve()`
3. Handle events in `upgradeWebSocket()` callback
4. Use `event.data` for messages and `ws.send()` for responses

This pattern ensures proper WebSocket functionality in production and development.
