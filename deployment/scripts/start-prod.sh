#!/bin/bash

# Production startup script for Orbit project
set -e

echo "🚀 Starting Orbit production environment..."

# Function to ensure service is running
ensure_service() {
    local service_name=$1
    local port=$2
    local max_attempts=10
    local attempt=0

    echo "🔍 Checking $service_name on port $port..."
    
    while ! nc -z localhost $port && [ $attempt -lt $max_attempts ]; do
        sleep 3
        attempt=$((attempt + 1))
        echo "  Attempt $attempt/$max_attempts..."
    done

    if [ $attempt -eq $max_attempts ]; then
        echo "❌ $service_name is not accessible"
        return 1
    fi
    
    echo "✅ $service_name is accessible"
    return 0
}

# Start Docker services in production mode
echo "🐳 Starting production Docker services..."
cd /app
docker-compose -f docker-compose.prod.yaml up -d redis mosquitto qdrant

# Wait for essential services
echo "⏳ Waiting for infrastructure services..."
sleep 10

# Verify services are running
ensure_service "Redis" 6379 || exit 1
ensure_service "MQTT" 1883 || exit 1
ensure_service "Qdrant" 6333 || exit 1

# Start backend service
echo "🔧 Starting backend service..."
cd /app/backend
dumb-init bun run start &
BACKEND_PID=$!

# Wait for backend
ensure_service "Backend" 8000 || exit 1

# Start web app service
echo "🌐 Starting web app service..."
cd /app/webapp
dumb-init python3 -m http.server 3000 -d dist &
WEB_PID=$!

# Wait for web app
ensure_service "Web App" 3000 || exit 1

echo "🎉 All production services are running!"
echo "📱 Web App: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 Redis: localhost:6379"
echo "📡 MQTT: localhost:1883"
echo "🔍 Qdrant: localhost:6333"

# Health monitoring loop
health_check() {
    while true; do
        echo "🏥 Performing health checks..."
        
        if ! ensure_service "Backend" 8000; then
            echo "❌ Backend health check failed"
        fi
        
        if ! ensure_service "Web App" 3000; then
            echo "❌ Web App health check failed"
        fi
        
        sleep 30
    done
}

# Start health monitoring in background
health_check &
HEALTH_PID=$!

# Keep the script running and handle graceful shutdown
trap 'echo "🛑 Shutting down gracefully..."; kill $BACKEND_PID $WEB_PID $HEALTH_PID; docker-compose down; exit 0' INT TERM

echo "✨ Production environment is running. Press Ctrl+C to stop."
wait