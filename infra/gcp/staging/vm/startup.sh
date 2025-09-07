#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/var/log/aniani-startup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

log() { echo "[startup] $(date -Is) $*"; }

# Fetch instance metadata attribute
md_get() {
  local key="$1"
  curl -fsS -H "Metadata-Flavor: Google" \
    "http://metadata.google.internal/computeMetadata/v1/instance/attributes/${key}" || true
}

DOCKER_HUB_USERNAME="$(md_get DOCKER_HUB_USERNAME)"
DOCKER_HUB_PASSWORD="$(md_get DOCKER_HUB_PASSWORD)"
VERSION="$(md_get VERSION)"

if [[ -z "${VERSION}" ]]; then VERSION="latest"; fi
if [[ -z "${DOCKER_HUB_USERNAME}" ]]; then
  log "ERROR: DOCKER_HUB_USERNAME metadata is required"
  exit 1
fi

log "Using Docker Hub user=${DOCKER_HUB_USERNAME}, version=${VERSION}"

# Add Docker sources
echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update and Install Docker Engine + Compose Plugin
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Test docker compose cli
docker compose version

# Install Docker and compose plugin (Ubuntu 22.04)
log "Installing Docker..."
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt install -y docker.io docker-compose-plugin git
systemctl enable --now docker
usermod -aG docker ${USER}

# Login to Docker Hub if password/token provided
if [[ -n "${DOCKER_HUB_PASSWORD}" ]]; then
  log "Logging in to Docker Hub..."
  echo -n "${DOCKER_HUB_PASSWORD}" | docker login -u "${DOCKER_HUB_USERNAME}" --password-stdin || true
else
  log "No Docker Hub password provided, assuming public images"
fi

APP_DIR="/opt/aniani"
mkdir -p "${APP_DIR}"
cd "${APP_DIR}"


log "Pulling images..."
docker compose pull || true

log "Starting containers..."
docker compose down -v || true
# Give Docker a moment to settle
sleep 2

docker compose up -d

# Health check loop for basic readiness
for i in {1..30}; do
  if curl -fsS http://localhost:3000/ >/dev/null 2>&1; then
    log "App is up on port 3000"
    exit 0
  fi
  sleep 2
  log "Waiting for app to become ready (${i}/30)"
done

log "Startup completed, but app health check did not pass within timeout"
exit 0

