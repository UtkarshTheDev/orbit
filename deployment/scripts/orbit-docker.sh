#!/bin/bash

# Orbit Docker development helper script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_help() {
    echo "Orbit Docker Development Helper"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  up-dev         - Start development environment"
    echo "  down-dev       - Stop development environment"
    echo "  restart-dev    - Restart development environment"
    echo "  logs-dev       - Show logs for development environment"
    echo "  shell-dev      - Get shell access to development container"
    echo "  up-prod        - Start production environment"
    echo "  down-prod      - Stop production environment"
    echo "  restart-prod   - Restart production environment"
    echo "  logs-prod      - Show logs for production environment"
    echo "  build          - Build the project"
    echo "  build-esp32    - Build ESP32 firmware"
    echo "  clean          - Clean all builds and dependencies"
    echo "  health         - Check health of all services"
    echo "  help           - Show this help message"
    echo ""
}

start_dev() {
    echo -e "${BLUE}🚀 Starting Orbit development environment...${NC}"
    docker-compose -f docker-compose.dev.yaml up -d
    echo -e "${GREEN}✅ Development environment started!${NC}"
    echo ""
    echo "Services running:"
    echo "  - Orbit Dev:     docker-compose -f docker-compose.dev.yaml logs -f orbit-dev"
    echo "  - ESP32 Dev:     docker-compose -f docker-compose.dev.yaml logs -f orbit-esp32"
    echo "  - Redis:         localhost:6379"
    echo "  - MQTT:          localhost:1883"
    echo "  - Qdrant:        localhost:6333"
    echo ""
    echo "To get shell access: $0 shell-dev"
}

stop_dev() {
    echo -e "${YELLOW}🛑 Stopping Orbit development environment...${NC}"
    docker-compose -f docker-compose.dev.yaml down
    echo -e "${GREEN}✅ Development environment stopped!${NC}"
}

start_prod() {
    echo -e "${BLUE}🚀 Starting Orbit production environment...${NC}"
    docker-compose -f docker-compose.prod.yaml up -d
    echo -e "${GREEN}✅ Production environment started!${NC}"
    echo ""
    echo "Services running:"
    echo "  - Web App:       http://localhost:3000"
    echo "  - Backend API:   http://localhost:8000"
    echo "  - Redis:         localhost:6379"
    echo "  - MQTT:          localhost:1883"
    echo "  - Qdrant:        localhost:6333"
    echo "  - ESP32 Firmware: http://localhost:8080"
    echo ""
    echo "To view logs: $0 logs-prod"
}

stop_prod() {
    echo -e "${YELLOW}🛑 Stopping Orbit production environment...${NC}"
    docker-compose -f docker-compose.prod.yaml down
    echo -e "${GREEN}✅ Production environment stopped!${NC}"
}

build_project() {
    echo -e "${BLUE}🔨 Building Orbit project...${NC}"
    ./deployment/scripts/build.sh
    echo -e "${GREEN}✅ Project built successfully!${NC}"
}

build_esp32() {
    echo -e "${BLUE}🔧 Building ESP32 firmware...${NC}"
    ./deployment/scripts/build-esp32.sh
    echo -e "${GREEN}✅ ESP32 firmware built successfully!${NC}"
}

clean_all() {
    echo -e "${YELLOW}🧹 Cleaning Orbit project...${NC}"
    docker-compose -f docker-compose.dev.yaml down -v --remove-orphans
    docker-compose -f docker-compose.prod.yaml down -v --remove-orphans
    docker system prune -f
    rm -rf node_modules apps/*/node_modules packages/*/node_modules .turbo
    echo -e "${GREEN}✅ Project cleaned successfully!${NC}"
}

check_health() {
    echo -e "${BLUE}🏥 Checking service health...${NC}"
    
    # Check development services
    echo "Development Services:"
    docker-compose -f docker-compose.dev.yaml ps
    
    echo ""
    echo "Production Services:"
    docker-compose -f docker-compose.prod.yaml ps
    
    echo ""
    echo "Port availability:"
    for port in 3000 8000 6379 1883 9001 6333 8080; do
        if nc -z localhost $port 2>/dev/null; then
            echo "  Port $port: ${GREEN}✅${NC}"
        else
            echo "  Port $port: ${RED}❌${NC}"
        fi
    done
}

# Main script
case "${1:-help}" in
    "up-dev")
        start_dev
        ;;
    "down-dev")
        stop_dev
        ;;
    "restart-dev")
        stop_dev
        start_dev
        ;;
    "logs-dev")
        docker-compose -f docker-compose.dev.yaml logs -f
        ;;
    "shell-dev")
        docker-compose -f docker-compose.dev.yaml exec orbit-dev /bin/sh
        ;;
    "up-prod")
        start_prod
        ;;
    "down-prod")
        stop_prod
        ;;
    "restart-prod")
        stop_prod
        start_prod
        ;;
    "logs-prod")
        docker-compose -f docker-compose.prod.yaml logs -f
        ;;
    "build")
        build_project
        ;;
    "build-esp32")
        build_esp32
        ;;
    "clean")
        clean_all
        ;;
    "health")
        check_health
        ;;
    "help"|*)
        print_help
        ;;
esac