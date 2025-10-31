#!/bin/bash
# -----------------------------------------------------------------------------
# startup.sh - VM startup script to configure environment and SSL
# -----------------------------------------------------------------------------

set -euo pipefail

echo "🚀 Starting coinbreakr VM initialization..."

# -----------------------------------------------------------------------------
# 1. Detect environment from instance metadata or default to main
# -----------------------------------------------------------------------------
ENVIRONMENT="main"

# Try to get environment from instance metadata
if command -v curl &> /dev/null; then
    METADATA_ENV=$(curl -s -H "Metadata-Flavor: Google" \
        "http://metadata.google.internal/computeMetadata/v1/instance/attributes/environment" 2>/dev/null || echo "")
    
    if [ -n "$METADATA_ENV" ]; then
        ENVIRONMENT="$METADATA_ENV"
    fi
fi

echo "📍 Environment detected: $ENVIRONMENT"

# -----------------------------------------------------------------------------
# 2. Create environment file
# -----------------------------------------------------------------------------
cat > /opt/coinbreakr/.env << EOF
ENVIRONMENT=$ENVIRONMENT
NODE_ENV=production
PORT=3000
EOF

echo "✅ Environment file created"

# -----------------------------------------------------------------------------
# 3. Start the application service
# -----------------------------------------------------------------------------
echo "🔄 Starting coinbreakr service..."
systemctl start coinbreakr.service

# Wait a moment for the service to start
sleep 10

# Check if service is running
if systemctl is-active --quiet coinbreakr.service; then
    echo "✅ Coinbreakr service started successfully"
else
    echo "⚠️  Coinbreakr service may not have started properly"
    systemctl status coinbreakr.service
fi

# -----------------------------------------------------------------------------
# 4. Trigger SSL setup (will run in background)
# -----------------------------------------------------------------------------
echo "🔐 Triggering SSL certificate setup..."
systemctl start ssl-setup.service &

echo "🎉 VM initialization complete!"
echo "📍 Application should be accessible via HTTP immediately"
echo "🔐 HTTPS will be available once SSL certificates are obtained"