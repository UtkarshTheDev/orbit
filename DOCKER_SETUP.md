# Orbit Docker Setup

This project includes a comprehensive Docker setup that allows you to run the entire Orbit application stack from development to production without installing any dependencies on your host machine.

## Quick Start

### Development Environment

```bash
# Start development environment
./deployment/scripts/orbit-docker.sh up-dev

# Get shell access to development container
./deployment/scripts/orbit-docker.sh shell-dev

# View logs
./deployment/scripts/orbit-docker.sh logs-dev

# Stop development environment
./deployment/scripts/orbit-docker.sh down-dev
```

### Production Environment

```bash
# Start production environment
./deployment/scripts/orbit-docker.sh up-prod

# View logs
./deployment/scripts/orbit-docker.sh logs-prod

# Stop production environment
./deployment/scripts/orbit-docker.sh down-prod
```

## Available Commands

| Command | Description |
|---------|-------------|
| `up-dev` | Start development environment |
| `down-dev` | Stop development environment |
| `restart-dev` | Restart development environment |
| `logs-dev` | Show development logs |
| `shell-dev` | Get shell access to dev container |
| `up-prod` | Start production environment |
| `down-prod` | Stop production environment |
| `restart-prod` | Restart production environment |
| `logs-prod` | Show production logs |
| `build` | Build the project |
| `build-esp32` | Build ESP32 firmware |
| `clean` | Clean all builds and dependencies |
| `health` | Check service health |
| `help` | Show help message |

## Architecture

### Development Container (`orbit-dev`)
- **Base**: oven/bun:1.1.2-alpine
- **Tools**: Bun, Turbo, Node.js, TypeScript, ESLint, Biome
- **Services**: Backend (Hono), Web App (React/Vite), Redis, MQTT, Qdrant
- **Port Mapping**: 3000 (Web), 8000 (API), 6379 (Redis), 1883 (MQTT), 6333 (Qdrant)

### Production Container
- **Backend**: Bun runtime with Hono server
- **Web App**: Static file server for React/Vite build
- **ESP32 Firmware**: HTTP server for firmware downloads

### ESP32 Development Container (`orbit-esp32`)
- **Base**: alpine/esp32-build-base
- **Tools**: Arduino CLI, ESP32 toolchain
- **Purpose**: Build and flash ESP32 firmware

## Services

### Infrastructure Services
- **Redis**: Message broker and cache (port 6379)
- **MQTT**: Eclipse Mosquitto message broker (port 1883, WebSocket 9001)
- **Qdrant**: Vector database (port 6333)

### Application Services
- **Backend API**: Hono server with Bun runtime (port 8000)
- **Web App**: React/Vite application (port 3000)
- **ESP32 Firmware**: HTTP server for firmware updates (port 8080)

## Build Process

### Development Build
```bash
# Install dependencies
bun install

# Start all services
./deployment/scripts/orbit-docker.sh up-dev

# Build applications
turbo run build
```

### Production Build
```bash
# Build project
./deployment/scripts/orbit-docker.sh build

# Start production environment
./deployment/scripts/orbit-docker.sh up-prod
```

### ESP32 Build
```bash
# Build ESP32 firmware
./deployment/scripts/orbit-docker.sh build-esp32
```

## Environment Variables

### Backend
- `NODE_ENV`: Environment (development/production)
- `REDIS_URL`: Redis connection URL
- `MQTT_BROKER`: MQTT broker URL
- `QDRANT_URL`: Qdrant connection URL

## File Structure

```
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.dev.yaml    # Development services
├── docker-compose.prod.yaml   # Production services
├── compose.yaml              # Infrastructure services
├── deployment/
│   ├── scripts/
│   │   ├── start-dev.sh      # Development startup
│   │   ├── start-prod.sh     # Production startup
│   │   ├── build.sh          # Build script
│   │   ├── build-esp32.sh    # ESP32 build script
│   │   └── orbit-docker.sh   # Docker helper script
│   └── mosquitto/
│       └── config/
│           └── mosquitto.conf # MQTT configuration
└── apps/
    ├── backend/              # Backend service
    ├── tablet/               # Web application
    └── esp32-firmware/       # ESP32 firmware
```

## Health Checks

All services include health checks:
- **Redis**: Redis ping command
- **MQTT**: MQTT publish test
- **Qdrant**: HTTP health endpoint
- **Backend**: API health endpoint
- **Web App**: HTTP health check

## Volume Management

### Development Volumes
- `/app`: Project source code
- `/app/node_modules`: Node modules (shared)
- `/root/.bun`: Bun cache (shared)

### Production Volumes
- `redis_data`: Redis persistence
- `qdrant_data`: Qdrant storage

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, 6379, 1883, 6333 are available
2. **Memory issues**: Docker containers may need more memory for builds
3. **Network issues**: Check Docker network configuration

### Debug Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs -f [service-name]

# Enter container shell
docker-compose exec [service-name] /bin/sh

# Clean Docker system
docker system prune -f
```

## Security Notes

- Development containers run as root for convenience
- Production containers run as non-root users
- Anonymous access is enabled for MQTT in development
- Consider authentication for production MQTT setup

## Performance

- Multi-stage builds optimize image size
- Volume mounts preserve build cache
- Health checks ensure service availability
- Restart policies handle service failures