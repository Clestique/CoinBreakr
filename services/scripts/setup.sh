#!/bin/bash
# -----------------------------------------------------------------------------
# setup.sh - Prepare Ubuntu server for running Node + Sequelize + PostgreSQL app in Docker
# -----------------------------------------------------------------------------
# Performs:
#  1. System update & upgrade
#  2. Install Docker & Docker Compose
#  3. Create app database via Docker Postgres
#  4. Create Linux user/group
#  5. Deploy app to /opt/coinbreakr
#  6. Set permissions
#  7. Launch containers
# -----------------------------------------------------------------------------

set -euo pipefail

APP_NAME="coinbreakr"
APP_DIR="/opt/${APP_NAME}"
APP_USER="vaisu.bhut"
APP_GROUP="${APP_NAME}"

# -----------------------------------------------------------------------------
# 0. Ensure root privileges
# -----------------------------------------------------------------------------
if [[ "$EUID" -ne 0 ]]; then
  echo "❌ Please run this script with sudo."
  exit 1
fi

echo "✅ Running as root..."

# -----------------------------------------------------------------------------
# 1. Update and upgrade system packages
# -----------------------------------------------------------------------------
echo "🔄 Updating package lists..."
apt update -y

echo "⬆️ Upgrading packages..."
apt upgrade -y

# -----------------------------------------------------------------------------
# 2. Install Docker and Docker Compose
# -----------------------------------------------------------------------------
echo "🐳 Installing Docker..."
apt install -y apt-transport-https ca-certificates curl software-properties-common

if ! command -v docker &> /dev/null; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt update -y
  apt install -y docker-ce docker-ce-cli containerd.io
else
  echo "✅ Docker already installed, skipping."
fi

if ! command -v docker-compose &> /dev/null; then
  echo "📦 Installing Docker Compose..."
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
else
  echo "✅ Docker Compose already installed, skipping."
fi

systemctl enable docker
systemctl start docker

# -----------------------------------------------------------------------------
# 3. Create Application Linux Group and User
# -----------------------------------------------------------------------------
echo "👥 Creating application group '${APP_GROUP}'..."
if ! getent group "${APP_GROUP}" >/dev/null; then
  groupadd "${APP_GROUP}"
else
  echo "Group '${APP_GROUP}' already exists."
fi

echo "👤 Creating application user '${APP_USER}'..."
if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  useradd -r -g "${APP_GROUP}" -s /usr/sbin/nologin "${APP_USER}"
else
  echo "User '${APP_USER}' already exists."
fi

# -----------------------------------------------------------------------------
# 4. Deploy Application Files
# -----------------------------------------------------------------------------
echo "📁 Deploying application files to ${APP_DIR}..."
mkdir -p "${APP_DIR}"
SRC_DIR="$(pwd)"

# Copy everything including hidden files
shopt -s dotglob
cp -r "${SRC_DIR}/"* "${APP_DIR}/"
shopt -u dotglob


# -----------------------------------------------------------------------------
# 6. Set File Ownership and Permissions
# -----------------------------------------------------------------------------
echo "🔐 Setting permissions for ${APP_DIR}..."
chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
chmod -R 750 "${APP_DIR}"


# -----------------------------------------------------------------------------
# 7. Install systemd units and enable services
# -----------------------------------------------------------------------------
SERVICE_NAME="coinbreakr"
SERVICE_FILE_SRC="/opt/coinbreakr/scripts/${SERVICE_NAME}.service"
SERVICE_FILE_DST="/etc/systemd/system/${SERVICE_NAME}.service"

STARTUP_SERVICE_NAME="coinbreakr-startup"
STARTUP_SERVICE_FILE_SRC="/opt/coinbreakr/scripts/${STARTUP_SERVICE_NAME}.service"
STARTUP_SERVICE_FILE_DST="/etc/systemd/system/${STARTUP_SERVICE_NAME}.service"

# Install main service
if [ -f "${SERVICE_FILE_SRC}" ]; then
  echo "📥 Installing systemd unit ${SERVICE_FILE_DST}..."
  cp "${SERVICE_FILE_SRC}" "${SERVICE_FILE_DST}"
  chmod 644 "${SERVICE_FILE_DST}"
else
  echo "⚠️  Systemd unit ${SERVICE_FILE_SRC} not found. Exiting."
  exit 1
fi

# Install startup service
if [ -f "${STARTUP_SERVICE_FILE_SRC}" ]; then
  echo "📥 Installing startup systemd unit ${STARTUP_SERVICE_FILE_DST}..."
  cp "${STARTUP_SERVICE_FILE_SRC}" "${STARTUP_SERVICE_FILE_DST}"
  chmod 644 "${STARTUP_SERVICE_FILE_DST}"
else
  echo "⚠️  Startup systemd unit ${STARTUP_SERVICE_FILE_SRC} not found. Exiting."
  exit 1
fi

# Reload systemd and enable services
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}.service"
systemctl enable "${STARTUP_SERVICE_NAME}.service"

echo "✅ Services installed and enabled for auto-start"

# -----------------------------------------------------------------------------
# 8. Make scripts executable
# -----------------------------------------------------------------------------
echo "🔧 Making scripts executable..."
chmod +x "${APP_DIR}/scripts/"*.sh

# -----------------------------------------------------------------------------
# 9. Setup SSL Certificates
# -----------------------------------------------------------------------------
echo "🔐 Setting up SSL certificates..."
"${APP_DIR}/scripts/ssl-setup.sh"

# -----------------------------------------------------------------------------
# 10. Start and Enable Service
# -----------------------------------------------------------------------------
echo "🚀 Starting and enabling CoinBreakr service..."
systemctl start "${SERVICE_NAME}.service"
systemctl enable "${SERVICE_NAME}.service"

# -----------------------------------------------------------------------------
# 11. Verify Service Configuration
# -----------------------------------------------------------------------------
echo "🔍 Verifying service configuration..."
if systemctl is-enabled ${SERVICE_NAME}.service >/dev/null 2>&1; then
  echo "✅ Service is enabled for auto-start on boot"
else
  echo "⚠️  Service may not be enabled properly"
fi

if systemctl is-active ${SERVICE_NAME}.service >/dev/null 2>&1; then
  echo "✅ Service is currently running"
else
  echo "⚠️  Service may not be running properly"
fi

echo "🔍 Waiting for services to start..."
sleep 30

echo "🔍 Checking service status..."
systemctl status "${SERVICE_NAME}.service" --no-pager -l

# -----------------------------------------------------------------------------
# 12. Create management symlink
# -----------------------------------------------------------------------------
echo "🔗 Creating management command symlink..."
ln -sf "${APP_DIR}/scripts/manage.sh" /usr/local/bin/coinbreakr

echo "✅ Setup completed! Your API will be available at:"
echo "🌐 https://api.beleno.clestiq.com"
echo "🌐 https://staging.beleno.clestiq.com"
echo ""
echo "📋 Management Commands:"
echo "  coinbreakr status    - Check service status"
echo "  coinbreakr restart   - Restart service"
echo "  coinbreakr logs      - View logs"
echo "  coinbreakr health    - Run health checks"
echo ""
echo "📋 Direct systemctl commands:"
echo "  sudo systemctl status coinbreakr"
echo "  sudo journalctl -u coinbreakr -f"
