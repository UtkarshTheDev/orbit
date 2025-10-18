#!/bin/bash

# Development startup script for Orbit project
set -e

echo "🚀 Starting Orbit development environment..."

# Function to wait for service
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=0

    echo "⏳ Waiting for $service_name on port $port..."
    
    while ! nc -z localhost $port && [ $attempt -lt $max_attempts ]; do
        sleep 1
        attempt=$((attempt + 1))
        echo "  Attempt $attempt/$max_attempts..."
    done

    if [ $attempt -eq $max_attempts ]; then
        echo "❌ $service_name did not start on time"
        exit 1
    fi
    
    echo "✅ $service_name is ready"
}

# Start Docker services
echo "🐳 Starting Docker services..."
cd /app
docker-compose up -d redis mosquitto qdrant

# Wait for services to be ready
wait_for_service "Redis" 6379
wait_for_service "MQTT" 1883
wait_for_service "Qdrant" 6333

# Start backend in background
echo "🔧 Starting backend..."
cd /apps/backend
bun run --hot src/index.ts &
BACKEND_PID=$!

# Wait for backend
wait_for_service "Backend" 8000

# Start web app in background
echo "🌐 Starting web app..."
cd /apps/tablet
bun run dev &
WEB_PID=$!

# Wait for web app
wait_for_service "Web App" 3000

echo "🎉 All services are running!"
echo "📱 Web App: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 Redis: localhost:6379"
echo "📡 MQTT: localhost:1883"
echo "🔍 Qdrant: localhost:6333"

# Keep the script running
trap 'echo "🛑 Shutting down..."; kill $BACKEND_PID $WEB_PID; exit 0' INT TERM
wait