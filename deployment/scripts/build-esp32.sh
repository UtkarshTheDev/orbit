#!/bin/bash

# ESP32 build script
set -e

echo "🔧 Building ESP32 firmware..."

# Install arduino-cli if not present
if ! command -v arduino-cli &> /dev/null; then
    echo "📦 Installing arduino-cli..."
    curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
    export PATH="$PATH:$HOME/bin"
fi

# Initialize arduino-cli
arduino-cli core update-index --additional-urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
arduino-cli core install esp32:esp32

# Build the firmware
echo "🏗️  Building firmware..."
cd /app/apps/esp32-firmware
arduino-cli compile --fqbn esp32:esp32:esp32 ./

echo "✅ ESP32 firmware built successfully!"
echo "📁 Firmware files:"
find . -name "*.bin" -type f