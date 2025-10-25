#!/bin/bash
# -----------------------------------------------------------------------------
# ssl-setup.sh - Setup SSL certificates with Let's Encrypt
# -----------------------------------------------------------------------------

set -euo pipefail

APP_DIR="/opt/coinbreakr"
EMAIL="vasubhut157@gmail.com" 
DOMAINS="api.beleno.clestiq.com,staging.beleno.clestiq.com"

echo "🔐 Setting up SSL certificates..."

# Create SSL directories
mkdir -p "${APP_DIR}/ssl/certbot/conf"
mkdir -p "${APP_DIR}/ssl/certbot/www"

# Create temporary nginx config for initial certificate generation
cat > "${APP_DIR}/config/nginx-temp.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name api.beleno.clestiq.com staging.beleno.clestiq.com;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 200 'OK';
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo "🚀 Starting temporary nginx for certificate generation..."
cd "${APP_DIR}"

# Start nginx temporarily for certificate generation
docker run -d --name temp_nginx \
  -p 80:80 \
  -v "${APP_DIR}/config/nginx-temp.conf:/etc/nginx/nginx.conf:ro" \
  -v "${APP_DIR}/ssl/certbot/www:/var/www/certbot:ro" \
  nginx:alpine

# Wait for nginx to start
sleep 5

echo "📜 Generating SSL certificates..."
# Generate certificates
docker run --rm \
  -v "${APP_DIR}/ssl/certbot/conf:/etc/letsencrypt" \
  -v "${APP_DIR}/ssl/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d api.beleno.clestiq.com \
  -d staging.beleno.clestiq.com

# Stop temporary nginx
echo "🛑 Stopping temporary nginx..."
docker stop temp_nginx
docker rm temp_nginx

# Remove temporary config
rm "${APP_DIR}/config/nginx-temp.conf"

echo "✅ SSL certificates generated successfully!"

# Set up certificate renewal cron job
echo "⏰ Setting up certificate renewal cron job..."
cat > /etc/cron.d/certbot-renewal << 'EOF'
0 12 * * * root cd /opt/coinbreakr && docker-compose run --rm certbot renew --webroot --webroot-path=/var/www/certbot && docker-compose exec nginx nginx -s reload
EOF

chmod 644 /etc/cron.d/certbot-renewal

echo "✅ SSL setup completed!"