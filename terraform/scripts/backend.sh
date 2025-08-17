#!/bin/bash
set -e

# Redirect all output to startup log
exec 1> >(tee -a /var/log/startup.log)
exec 2>&1

echo "$(date): Starting backend setup..."

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

# Pull and run Backend container
echo "$(date): Pulling Docker image: ${backend_image}"
if docker pull ${backend_image}; then
    echo "$(date): Successfully pulled ${backend_image}"
else
    echo "$(date): Failed to pull ${backend_image}"
    exit 1
fi

echo "$(date): Starting backend container..."
docker run -d \
  --name backend \
  --restart unless-stopped \
  -p 5000:5000 \
  -e MONGODB_URI=mongodb://${database_ip}:27017/forum \
  -e NODE_ENV=production \
  ${backend_image}

# Verify container is running
echo "$(date): Verifying container status..."
if docker ps | grep backend > /dev/null; then
    echo "$(date): Backend container is running successfully"
else
    echo "$(date): Backend container failed to start"
    docker logs backend || true
    exit 1
fi

echo "$(date): Backend setup completed successfully"
