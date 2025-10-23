# Orbit Backend

Hono + Bun WebSocket server for the Orbit robot application.

## Features

- WebSocket server with Hono and Bun
- CORS support for cross-origin requests
- Automatic reconnection handling
- Health check endpoints
- Client role management (tablet/phone)
- Polaroid queue system
- Heartbeat/ping-pong for connection health

## Installation

```bash
bun install
```

## Development

```bash
bun run dev
```

Server runs at http://localhost:3001
WebSocket endpoint: ws://localhost:3001/ws

## Production

```bash
bun run start:prod
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 3001, auto-set by Render)
- `NODE_ENV` - Environment (development/production)
- `WS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins

## API Endpoints

- `GET /` - Server info
- `GET /health` - Health check
- `GET /ws` - WebSocket upgrade endpoint

## Deployment

See [DEPLOYMENT.md](../../DEPLOYMENT.md) for detailed deployment instructions to Render.
