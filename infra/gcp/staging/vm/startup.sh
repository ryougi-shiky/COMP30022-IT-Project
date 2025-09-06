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

# Install Docker and compose plugin (Ubuntu 22.04)
log "Installing Docker..."
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-plugin
systemctl enable --now docker
usermod -aG docker ubuntu || true

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

# Render docker-compose.yml using provided images
cat > docker-compose.yml <<EOF
version: "3.9"
services:
  backend:
    image: ${DOCKER_HUB_USERNAME}/forum-backend:${VERSION}
    container_name: backend
    depends_on:
      - mongodb
    environment:
      MONGODB_URI: "mongodb://mongodb:27017"
      MONGODB_NAME: "ani"
      NODE_ENV: "production"
      PORT: "17000"
      CORS_WHITELIST: "*"
    restart: always
    networks: [app-network]

  mongodb:
    image: ${DOCKER_HUB_USERNAME}/forum-mongodb:${VERSION}
    container_name: mongodb
    volumes:
      - mongodb_data:/data/db
    restart: always
    networks: [app-network]

  nginx:
    image: ${DOCKER_HUB_USERNAME}/forum-nginx:${VERSION}
    container_name: nginx
    depends_on:
      - backend
    ports:
      - "3000:3000"
    restart: always
    networks: [app-network]

networks:
  app-network:
    driver: bridge

volumes:
  mongodb_data:
    name: mongodb_data
EOF

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

