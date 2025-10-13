# Multi-stage build for development environment
FROM oven/bun:1.1.2-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    docker

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* turbo.json biome.jsonc ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Development stage
FROM base AS development

# Expose ports for all services
EXPOSE 3000 8000 6379 1883 9001 6333

# Default command for development
CMD ["bun", "run", "dev"]

# Build stage
FROM base AS build

# Build all applications
RUN turbo run build

# Production stage for backend
FROM oven/bun:1.1.2-alpine AS production-backend

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init

# Set working directory
WORKDIR /app

# Copy built artifacts from build stage
COPY --from=build /apps/backend/dist ./backend/dist
COPY --from=build /apps/backend/package.json ./backend/

# Copy root dependencies needed for runtime
COPY package.json ./

# Install production dependencies
RUN bun install --production --frozen-lockfile

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership
RUN chown -R backend:nodejs /app
USER backend

# Expose port
EXPOSE 8000

# Start the backend
CMD ["dumb-init", "bun", "run", "start"]

# Production stage for web app
FROM node:20-alpine AS production-webapp

# Install system dependencies
RUN apk add --no-cache \
    dumb-init

# Set working directory
WORKDIR /app

# Copy built artifacts from build stage
COPY --from=build /apps/tablet/dist ./webapp/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S webapp -u 1001

# Change ownership
RUN chown -R webapp:nodejs /app
USER webapp

# Expose port
EXPOSE 3000

# Serve the web app using a simple HTTP server
CMD ["dumb-init", "python3", "-m", "http.server", "3000", "-d", "/app/webapp/dist"]

# ESP32 build stage
FROM alpine/esp32-build-base:latest AS esp32-builder

# Set working directory
WORKDIR /app

# Copy ESP32 firmware
COPY apps/esp32-firmware/ ./esp32-firmware/

# Build the firmware
RUN cd esp32-firmware && \
    arduino-cli compile --fqbn esp32:esp32:esp32 ./

# Production ESP32 firmware
FROM alpine:latest AS production-esp32

# Copy built firmware
COPY --from=esp32-builder /app/esp32-firmware/*.bin ./firmware/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD echo "ESP32 firmware container healthy"

# Final development image (combines all services)
FROM base AS dev-environment

# Install additional development tools
RUN bun add -g @biomejs/biome eslint prettier turbo

# Copy development scripts
RUN mkdir -p /scripts
COPY deployment/scripts/ /scripts/

# Make scripts executable
RUN chmod +x /scripts/*.sh

# Expose all ports
EXPOSE 3000 8000 6379 1883 9001 6333

# Default command
CMD ["/scripts/start-dev.sh"]

# Production stage with all services
FROM production-backend AS production

# Copy webapp
COPY --from=production-webapp /app/webapp/dist ./webapp/dist

# Copy ESP32 firmware
COPY --from=production-esp32 /app/firmware ./firmware

# Copy deployment scripts
COPY deployment/scripts/ /scripts/
RUN chmod +x /scripts/*.sh

# Create non-root user for production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S orbit -u 1001
RUN chown -R orbit:nodejs /app
USER orbit

# Expose ports
EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start all services
CMD ["/scripts/start-prod.sh"]