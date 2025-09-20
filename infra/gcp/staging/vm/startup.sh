#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/var/log/aniani-startup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

log() { echo "[startup] $(date -Is) $*"; }

log "Starting VM startup script..."

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

# Update system packages
log "Updating system packages..."
apt-get update -y

# Install prerequisites
log "Installing prerequisites..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
log "Adding Docker GPG key..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
log "Adding Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index with Docker repository
apt-get update -y

# Install Docker Engine + Compose Plugin
log "Installing Docker..."
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable and start Docker service
systemctl enable docker
systemctl start docker

# Verify Docker installation
log "Verifying Docker installation..."
docker --version
docker compose version

# Login to Docker Hub if password/token provided
if [[ -n "${DOCKER_HUB_PASSWORD}" ]]; then
  log "Logging in to Docker Hub..."
  echo -n "${DOCKER_HUB_PASSWORD}" | docker login -u "${DOCKER_HUB_USERNAME}" --password-stdin
else
  log "No Docker Hub password provided, assuming public images"
fi

# Create application directory
APP_DIR="/opt/aniani"
log "Creating application directory: ${APP_DIR}"
mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

# Retrieve docker-compose.yml from metadata
log "Retrieving docker-compose.yml from metadata..."
md_get "docker-compose-yml" > docker-compose.yml

if [[ ! -f docker-compose.yml ]]; then
  log "ERROR: Failed to retrieve docker-compose.yml from metadata"
  exit 1
fi

log "Docker compose file content:"
cat docker-compose.yml

# Set environment variables for docker-compose
export DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME}"
export VERSION="${VERSION}"

log "Pulling Docker images..."
docker compose pull

log "Starting containers..."
# Stop any existing containers
docker compose down -v || true

# Give Docker a moment to clean up
sleep 3

# Start the application
docker compose up -d

# Wait for containers to start
sleep 5

# Show container status
log "Container status:"
docker compose ps

# Health check loop for basic readiness
log "Performing health check..."
for i in {1..60}; do
  if curl -fsS http://localhost:3000/ >/dev/null 2>&1; then
    log "✅ App is up and running on port 3000!"
    log "External URL: http://$(curl -fsS -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip):3000"
    exit 0
  fi
  sleep 5
  log "Waiting for app to become ready (${i}/60)..."
done

log "⚠️  Startup completed, but app health check did not pass within timeout"
log "Container logs:"
docker compose logs --tail=50

exit 0
