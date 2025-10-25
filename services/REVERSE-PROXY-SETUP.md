# Reverse Proxy Setup with Nginx and SSL

This setup configures a reverse proxy using Nginx to route HTTPS traffic from your domain to the Node.js application running on port 3000, with automatic SSL certificate management via Let's Encrypt.

## Architecture

```
Internet → Domain (api.beleno.clestiq.com) → Nginx (Port 80/443) → Node.js App (Port 3000)
```

## Components

### 1. Nginx Reverse Proxy
- **Container**: `coinbreakr_nginx`
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Config**: `/config/nginx.conf`
- **Features**:
  - HTTP to HTTPS redirect
  - SSL termination
  - Rate limiting (10 req/s with burst of 20)
  - Security headers
  - Gzip compression

### 2. Let's Encrypt SSL
- **Container**: `coinbreakr_certbot`
- **Domains**: `api.beleno.clestiq.com`, `staging.beleno.clestiq.com`
- **Auto-renewal**: Configured via cron job

### 3. Node.js Application
- **Container**: `coinbreakr_app`
- **Port**: 3000 (internal only)
- **Access**: Only via reverse proxy

## Security Features

### Firewall Rules
- ✅ Port 80 (HTTP) - Open for Let's Encrypt challenges and redirects
- ✅ Port 443 (HTTPS) - Open for secure API access
- ❌ Port 3000 - **BLOCKED** from external access
- ✅ Port 22 (SSH) - Open for server management

### SSL Configuration
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS headers
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

### Rate Limiting
- 10 requests per second per IP
- Burst allowance of 20 requests
- Health check endpoint bypasses rate limiting

## Management Scripts

### SSL Certificate Management
```bash
# Initial setup (run during deployment)
./scripts/ssl-setup.sh

# Manual renewal
./scripts/ssl-renew.sh
```

### Health Checks
```bash
# Verify everything is working
./scripts/health-check.sh
```

## URLs

### Production (Main Environment)
- **API**: https://api.beleno.clestiq.com
- **Health Check**: https://api.beleno.clestiq.com/v1/healthz

### Staging Environment
- **API**: https://staging.beleno.clestiq.com
- **Health Check**: https://staging.beleno.clestiq.com/v1/healthz

## Deployment Process

1. **Terraform Apply**: Creates infrastructure with updated firewall rules
2. **Packer Build**: Creates VM image with Nginx and SSL setup
3. **Instance Launch**: Automatically configures reverse proxy and SSL
4. **DNS Propagation**: Domain points to instance IP
5. **SSL Generation**: Let's Encrypt certificates are automatically generated

## Monitoring

### Container Status
```bash
docker-compose ps
```

### Nginx Logs
```bash
docker-compose logs nginx
```

### SSL Certificate Status
```bash
docker-compose run --rm certbot certificates
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Generation Fails**
   - Ensure DNS is properly configured
   - Check firewall allows port 80
   - Verify domain points to correct IP

2. **502 Bad Gateway**
   - Check if app container is running
   - Verify app is listening on port 3000
   - Check docker network connectivity

3. **Rate Limiting Issues**
   - Adjust rate limits in nginx.conf
   - Check if legitimate traffic is being blocked

### Useful Commands

```bash
# Restart all services
docker-compose restart

# View real-time logs
docker-compose logs -f

# Test SSL configuration
openssl s_client -servername api.beleno.clestiq.com -connect api.beleno.clestiq.com:443

# Check certificate expiry
echo | openssl s_client -servername api.beleno.clestiq.com -connect api.beleno.clestiq.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Automatic Renewal

SSL certificates are automatically renewed via cron job:
- **Schedule**: Daily at 12:00 PM
- **Command**: Runs certbot renewal and reloads nginx
- **Location**: `/etc/cron.d/certbot-renewal`