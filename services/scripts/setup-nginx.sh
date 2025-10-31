#!/bin/bash
# -----------------------------------------------------------------------------
# setup-nginx.sh - Configure nginx reverse proxy with SSL
# -----------------------------------------------------------------------------

set -euo pipefail

# Determine domain based on environment or use default
if [ -f "/opt/coinbreakr/.env" ]; then
    source /opt/coinbreakr/.env
fi

# Set domain based on environment
if [ "${ENVIRONMENT:-main}" = "staging" ]; then
    DOMAIN="staging.splitlyr.clestiq.com"
else
    DOMAIN="api.splitlyr.clestiq.com"
fi

EMAIL="vasubhut157@gmail.com"  # Change this to your email
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

echo "🔧 Setting up nginx reverse proxy for ${DOMAIN}..."

# -----------------------------------------------------------------------------
# 1. Install nginx and certbot
# -----------------------------------------------------------------------------
echo "📦 Installing nginx and certbot..."
apt update -y
apt install -y nginx certbot python3-certbot-nginx

# -----------------------------------------------------------------------------
# 2. Copy nginx configuration
# -----------------------------------------------------------------------------
echo "📝 Configuring nginx..."

# Copy main nginx config
cp /opt/coinbreakr/config/nginx.conf /etc/nginx/nginx.conf

# Copy site configuration
cp "/opt/coinbreakr/config/${DOMAIN}" "${NGINX_SITES_AVAILABLE}/${DOMAIN}"

# Create temporary HTTP-only config for initial SSL setup
cat > "${NGINX_SITES_AVAILABLE}/${DOMAIN}.temp" << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        proxy_pass http://localhost:3000/v1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable temporary site
ln -sf "${NGINX_SITES_AVAILABLE}/${DOMAIN}.temp" "${NGINX_SITES_ENABLED}/${DOMAIN}"

# Remove default nginx site
rm -f "${NGINX_SITES_ENABLED}/default"

# Test nginx configuration
nginx -t

# Start nginx
systemctl enable nginx
systemctl start nginx

echo "✅ Nginx configured and started"

# -----------------------------------------------------------------------------
# 3. Obtain SSL certificate
# -----------------------------------------------------------------------------
echo "🔐 Obtaining SSL certificate for ${DOMAIN}..."

# Wait a moment for nginx to fully start
sleep 5

# Obtain SSL certificate
certbot certonly \
    --webroot \
    --webroot-path=/var/www/html \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --domains "${DOMAIN}" \
    --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully"
    
    # Now switch to the full HTTPS configuration
    ln -sf "${NGINX_SITES_AVAILABLE}/${DOMAIN}" "${NGINX_SITES_ENABLED}/${DOMAIN}"
    
    # Remove temporary config
    rm -f "${NGINX_SITES_AVAILABLE}/${DOMAIN}.temp"
    
    # Test configuration
    nginx -t
    
    # Reload nginx with SSL config
    systemctl reload nginx
    
    echo "✅ HTTPS configuration activated"
else
    echo "❌ Failed to obtain SSL certificate"
    echo "⚠️  Continuing with HTTP-only configuration"
fi

# -----------------------------------------------------------------------------
# 4. Set up automatic certificate renewal
# -----------------------------------------------------------------------------
echo "🔄 Setting up automatic certificate renewal..."

# Add renewal cron job
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo "✅ Automatic certificate renewal configured"

# -----------------------------------------------------------------------------
# 5. Configure firewall (if ufw is installed)
# -----------------------------------------------------------------------------
if command -v ufw &> /dev/null; then
    echo "🔥 Configuring firewall..."
    ufw allow 'Nginx Full'
    echo "✅ Firewall configured"
fi

echo "🎉 Nginx reverse proxy setup complete!"
echo "📍 Your API is now accessible at: https://${DOMAIN}"
echo "🔄 It will proxy requests to: http://localhost:3000"