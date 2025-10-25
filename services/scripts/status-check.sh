#!/bin/bash
# -----------------------------------------------------------------------------
# status-check.sh - Check the status of CoinBreakr services
# -----------------------------------------------------------------------------

set -euo pipefail

SERVICE_NAME="coinbreakr"
APP_DIR="/opt/coinbreakr"

echo "🔍 CoinBreakr Service Status Check"
echo "=================================="

# Check systemd service status
echo "📋 Systemd Service Status:"
if systemctl is-active ${SERVICE_NAME}.service >/dev/null 2>&1; then
    echo "✅ Service is RUNNING"
else
    echo "❌ Service is NOT RUNNING"
fi

if systemctl is-enabled ${SERVICE_NAME}.service >/dev/null 2>&1; then
    echo "✅ Service is ENABLED (will start on boot)"
else
    echo "❌ Service is NOT ENABLED"
fi

echo ""
echo "📊 Detailed Service Status:"
systemctl status ${SERVICE_NAME}.service --no-pager -l || true

echo ""
echo "🐳 Docker Container Status:"
cd "${APP_DIR}"
if command -v docker-compose &> /dev/null; then
    docker-compose ps || echo "❌ Could not get container status"
else
    echo "❌ Docker Compose not found"
fi

echo ""
echo "🌐 Network Connectivity Test:"
# Test if nginx is responding on port 80
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:80 >/dev/null 2>&1; then
    echo "✅ HTTP port 80 is responding"
else
    echo "❌ HTTP port 80 is not responding"
fi

# Test if nginx is responding on port 443
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 -k https://localhost:443 >/dev/null 2>&1; then
    echo "✅ HTTPS port 443 is responding"
else
    echo "❌ HTTPS port 443 is not responding"
fi

echo ""
echo "📝 Recent Service Logs (last 10 lines):"
journalctl -u ${SERVICE_NAME}.service -n 10 --no-pager || echo "❌ Could not retrieve logs"

echo ""
echo "🔧 Useful Commands:"
echo "  Start service:   sudo systemctl start ${SERVICE_NAME}"
echo "  Stop service:    sudo systemctl stop ${SERVICE_NAME}"
echo "  Restart service: sudo systemctl restart ${SERVICE_NAME}"
echo "  View logs:       sudo journalctl -u ${SERVICE_NAME} -f"
echo "  Service status:  sudo systemctl status ${SERVICE_NAME}"