#!/bin/bash
# -----------------------------------------------------------------------------
# ssl-renew.sh - Renew SSL certificates
# -----------------------------------------------------------------------------

set -euo pipefail

APP_DIR="/opt/coinbreakr"

echo "🔄 Renewing SSL certificates..."

cd "${APP_DIR}"

# Renew certificates
docker-compose run --rm certbot renew --webroot --webroot-path=/var/www/certbot

# Reload nginx to use new certificates
docker-compose exec nginx nginx -s reload

echo "✅ SSL certificates renewed and nginx reloaded!"