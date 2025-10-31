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

# Copy site configurations
cp "/opt/coinbreakr/config/${DOMAIN}" "${NGINX_SITES_AVAILABLE}/${DOMAIN}"
cp "/opt/coinbreakr/config/http-only.conf" "${NGINX_SITES_AVAILABLE}/http-only"

# Enable HTTP-only configuration initially (no SSL during image build)
ln -sf "${NGINX_SITES_AVAILABLE}/http-only" "${NGINX_SITES_ENABLED}/default-site"

# Remove default nginx site
rm -f "${NGINX_SITES_ENABLED}/default"

# Test nginx configuration
nginx -t

# Start nginx
systemctl enable nginx
systemctl start nginx

echo "✅ Nginx configured and started"

# -----------------------------------------------------------------------------
# 3. Setup SSL certificate service (to run after deployment)
# -----------------------------------------------------------------------------
echo "🔐 Setting up SSL certificate service..."

# Create SSL setup script that will run after deployment
cat > /opt/coinbreakr/scripts/setup-ssl.sh << 'EOF'
#!/bin/bash
# SSL setup script - runs after DNS is configured

set -euo pipefail

# Determine domain based on environment
if [ -f "/opt/coinbreakr/.env" ]; then
    source /opt/coinbreakr/.env
fi

if [ "${ENVIRONMENT:-main}" = "staging" ]; then
    DOMAIN="staging.splitlyr.clestiq.com"
else
    DOMAIN="api.splitlyr.clestiq.com"
fi

EMAIL="admin@clestiq.com"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

echo "🔐 Obtaining SSL certificate for ${DOMAIN}..."

# Check if domain resolves to this server
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short ${DOMAIN} | tail -n1)

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️  Domain ${DOMAIN} does not resolve to this server yet (${SERVER_IP} != ${DOMAIN_IP})"
    echo "⚠️  Waiting 60 seconds for DNS propagation..."
    sleep 60
fi

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
    
    # Switch to the full HTTPS configuration
    ln -sf "${NGINX_SITES_AVAILABLE}/${DOMAIN}" "${NGINX_SITES_ENABLED}/${DOMAIN}"
    
    # Test configuration
    nginx -t
    
    # Reload nginx with SSL config
    systemctl reload nginx
    
    echo "✅ HTTPS configuration activated"
    
    # Remove this script from startup
    systemctl disable ssl-setup.service || true
else
    echo "❌ Failed to obtain SSL certificate"
    echo "⚠️  Will retry on next boot"
fi
EOF

chmod +x /opt/coinbreakr/scripts/setup-ssl.sh

# Create systemd service for SSL setup
cat > /etc/systemd/system/ssl-setup.service << EOF
[Unit]
Description=Setup SSL certificates for nginx
After=network-online.target nginx.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/opt/coinbreakr/scripts/setup-ssl.sh
RemainAfterExit=yes
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable the SSL setup service
systemctl daemon-reload
systemctl enable ssl-setup.service

echo "✅ SSL setup service configured to run after deployment"

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