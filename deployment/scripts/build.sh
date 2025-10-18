#!/bin/bash

# Build script for Orbit project
set -e

echo "🔨 Building Orbit project..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
bun run clean

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install --frozen-lockfile
fi

# Build all applications
echo "🏗️  Building applications..."
turbo run build

# Run linting and type checking
echo "🔍 Running quality checks..."
bun run lint
bun run type-check

echo "✅ Build completed successfully!"