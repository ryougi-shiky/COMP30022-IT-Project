#!/bin/bash
set -e

# Redirect all output to startup log
exec 1> >(tee -a /var/log/startup.log)
exec 2>&1

echo "$(date): Starting database setup..."

# Update system
echo "$(date): Updating system packages..."
apt-get update
apt-get install -y docker.io

# Start Docker
echo "$(date): Starting Docker service..."
systemctl enable docker
systemctl start docker

# Wait for Docker to be ready
echo "$(date): Waiting for Docker to be ready..."
until docker info > /dev/null 2>&1; do
    echo "$(date): Waiting for Docker daemon..."
    sleep 2
done

# Pull and run MongoDB container
echo "$(date): Pulling Docker image: ${mongo_image}"
if docker pull ${mongo_image}; then
    echo "$(date): Successfully pulled ${mongo_image}"
else
    echo "$(date): Failed to pull ${mongo_image}"
    exit 1
fi

echo "$(date): Creating data directory..."
mkdir -p /data/db

echo "$(date): Starting MongoDB container..."
docker run -d \
  --name mongodb \
  --restart unless-stopped \
  -p 27017:27017 \
  -v /data/db:/data/db \
  ${mongo_image}

# Wait for MongoDB to be ready
echo "$(date): Waiting for MongoDB to be ready..."
sleep 30

# Verify container is running
echo "$(date): Verifying container status..."
if docker ps | grep mongodb > /dev/null; then
    echo "$(date): MongoDB container is running successfully"
else
    echo "$(date): MongoDB container failed to start"
    docker logs mongodb || true
    exit 1
fi

echo "$(date): Database setup completed successfully"
