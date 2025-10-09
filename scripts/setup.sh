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
APP_USER="coinbreakrapp"
APP_GROUP="${APP_NAME}"
COMPOSE_FILE="docker-compose.yml"

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

# Expecting app.zip or docker-compose.yml in same dir as setup.sh
SRC_DIR="$(pwd)"
ZIP_FILE="${SRC_DIR}/app.zip"

if [ -f "${ZIP_FILE}" ]; then
  unzip -o "${ZIP_FILE}" -d "${APP_DIR}"
else
  echo "⚠️ app.zip not found, checking for existing files..."
  cp -r ${SRC_DIR}/* "${APP_DIR}/" || echo "No files copied."
fi

# -----------------------------------------------------------------------------
# 5. Set File Ownership and Permissions
# -----------------------------------------------------------------------------
echo "🔐 Setting permissions for ${APP_DIR}..."
chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"
chmod -R 750 "${APP_DIR}"

# -----------------------------------------------------------------------------
# 6. Start Application via Docker Compose
# -----------------------------------------------------------------------------
if [ -f "${APP_DIR}/${COMPOSE_FILE}" ]; then
  echo "🚀 Starting application containers..."
  cd "${APP_DIR}"
  docker-compose pull
  docker-compose up -d
else
  echo "❌ docker-compose.yml not found in ${APP_DIR}. Cannot start containers."
fi

# -----------------------------------------------------------------------------
# 7. Verify containers
# -----------------------------------------------------------------------------
echo "🧾 Checking running containers..."
docker ps

echo "🎉 Setup complete!"
echo "Your application is running via Docker Compose in ${APP_DIR}"
