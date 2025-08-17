#!/bin/bash
set -e

# Redirect all output to startup log
exec 1> >(tee -a /var/log/startup.log)
exec 2>&1

echo "$(date): Starting frontend setup..."

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

# Pull and run Frontend container
echo "$(date): Pulling Docker image: ${frontend_image}"
if docker pull ${frontend_image}; then
    echo "$(date): Successfully pulled ${frontend_image}"
else
    echo "$(date): Failed to pull ${frontend_image}"
    exit 1
fi

echo "$(date): Starting frontend container..."
docker run -d \
  --name frontend \
  --restart unless-stopped \
  -p 80:80 \
  -e REACT_APP_API_URL=http://${backend_ip}:5000 \
  ${frontend_image}

# Verify container is running
echo "$(date): Verifying container status..."
if docker ps | grep frontend > /dev/null; then
    echo "$(date): Frontend container is running successfully"
else
    echo "$(date): Frontend container failed to start"
    docker logs frontend || true
    exit 1
fi

echo "$(date): Frontend setup completed successfully"
