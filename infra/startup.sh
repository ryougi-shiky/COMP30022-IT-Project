#!/bin/bash
set -e

# Update system
apt-get update
apt-get install -y curl git

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $(whoami)

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone the application repository
cd /opt
git clone https://github.com/your-username/COMP30022-IT-Project.git app
cd app

# Create environment variables for MongoDB
cat > .env << EOF
MONGO_ROOT_USERNAME=${mongo_username}
MONGO_ROOT_PASSWORD=${mongo_password}
NODE_ENV=production
EOF

# Build and start the application
docker-compose -f deploy/docker-compose.local.yml up -d

# Setup systemd service to auto-start on boot
cat > /etc/systemd/system/comp30022-app.service << EOF
[Unit]
Description=COMP30022 MERN Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/app
ExecStart=/usr/local/bin/docker-compose -f deploy/docker-compose.local.yml up -d
ExecStop=/usr/local/bin/docker-compose -f deploy/docker-compose.local.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl enable comp30022-app.service
systemctl start comp30022-app.service

echo "Application setup completed!"
