#!/bin/bash
# -----------------------------------------------------------------------------
# health-check.sh - Verify the reverse proxy setup is working
# -----------------------------------------------------------------------------

set -euo pipefail

APP_DIR="/opt/coinbreakr"

echo "🔍 Performing health checks..."

# Check if service is running
echo "📋 Checking systemd service status..."
if systemctl is-active coinbreakr.service >/dev/null 2>&1; then
    echo "✅ CoinBreakr service is running"
else
    echo "❌ CoinBreakr service is not running"
    exit 1
fi

# Check if containers are running
echo "📦 Checking container status..."
cd "${APP_DIR}"
docker-compose ps

# Check if nginx is responding
echo "🌐 Testing HTTP redirect..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://api.beleno.clestiq.com || echo "000")
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
    echo "✅ HTTP redirect working (Status: $HTTP_RESPONSE)"
else
    echo "❌ HTTP redirect not working (Status: $HTTP_RESPONSE)"
fi

# Check if HTTPS is working
echo "🔒 Testing HTTPS endpoint..."
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.beleno.clestiq.com/v1/healthz || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "✅ HTTPS endpoint working (Status: $HTTPS_RESPONSE)"
else
    echo "❌ HTTPS endpoint not working (Status: $HTTPS_RESPONSE)"
fi

# Check SSL certificate
echo "🔐 Checking SSL certificate..."
SSL_EXPIRY=$(echo | openssl s_client -servername api.beleno.clestiq.com -connect api.beleno.clestiq.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
if [ -n "$SSL_EXPIRY" ]; then
    echo "✅ SSL certificate valid until: $SSL_EXPIRY"
else
    echo "❌ SSL certificate check failed"
fi

# Test direct port 3000 access (should fail)
echo "🚫 Testing direct port 3000 access (should fail)..."
DIRECT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$(curl -s ifconfig.me):3000/v1/healthz || echo "000")
if [ "$DIRECT_RESPONSE" = "000" ] || [ "$DIRECT_RESPONSE" = "Connection refused" ]; then
    echo "✅ Direct port 3000 access blocked (Status: $DIRECT_RESPONSE)"
else
    echo "⚠️  Direct port 3000 access still possible (Status: $DIRECT_RESPONSE)"
fi

echo "🏁 Health check completed!"