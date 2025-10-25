#!/bin/bash
# -----------------------------------------------------------------------------
# startup.sh - Instance startup script to ensure services start properly
# -----------------------------------------------------------------------------

set -euo pipefail

SERVICE_NAME="coinbreakr"
APP_DIR="/opt/coinbreakr"

echo "🚀 CoinBreakr Instance Startup Script"
echo "====================================="

# Wait for Docker to be ready
echo "⏳ Waiting for Docker daemon to be ready..."
until docker info >/dev/null 2>&1; do
    echo "Waiting for Docker daemon..."
    sleep 2
done
echo "✅ Docker daemon is ready"

# Ensure the service is enabled
echo "🔧 Ensuring service is enabled..."
systemctl enable ${SERVICE_NAME}.service

# Start the service
echo "🚀 Starting CoinBreakr service..."
systemctl start ${SERVICE_NAME}.service

# Wait a bit for services to start
echo "⏳ Waiting for services to initialize..."
sleep 30

# Check status
echo "🔍 Checking service status..."
if systemctl is-active ${SERVICE_NAME}.service >/dev/null 2>&1; then
    echo "✅ CoinBreakr service is running successfully"
else
    echo "❌ CoinBreakr service failed to start"
    systemctl status ${SERVICE_NAME}.service --no-pager -l
    exit 1
fi

# Check containers
echo "🐳 Checking container status..."
cd "${APP_DIR}"
docker-compose ps

echo "✅ Startup completed successfully!"
echo "🌐 API should be available at:"
echo "  - https://api.beleno.clestiq.com"
echo "  - https://staging.beleno.clestiq.com"