#!/usr/bin/env bash
set -xe

# update
apt-get update -y

# install essentials
apt-get install -y curl git ca-certificates

# install docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# install docker compose v2 plugin
mkdir -p /usr/libexec/docker/cli-plugins || true
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# add packer user to docker group (packer's provisioner runs as root by default,
# but in runtime we want whatever user to be able to run docker if needed)
usermod -aG docker ubuntu || true

# create app dir (you may change paths)
mkdir -p /opt/app
chown -R root:root /opt/app

# If you have your compose file in remote repo, you can clone or download it here.
# For example, clone the repo and copy deploy/docker-compose.local.yml
# (make sure repo is public OR you have a way to authenticate)
git clone https://github.com/ryougi-shiky/COMP30022-IT-Project.git /opt/app-src || true

# Example: copy compose file if exists at deploy/docker-compose.local.yml
if [ -f /opt/app-src/deploy/docker-compose.local.yml ]; then
  cp /opt/app-src/deploy/docker-compose.local.yml /opt/app/docker-compose.yml
fi

# Create a systemd service to start docker-compose on boot
cat > /etc/systemd/system/comp30022-app.service <<'EOF'
[Unit]
Description=COMP30022 MERN Application
After=docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/opt/app
ExecStart=/usr/libexec/docker/cli-plugins/docker-compose -f /opt/app/docker-compose.yml up -d
ExecStop=/usr/libexec/docker/cli-plugins/docker-compose -f /opt/app/docker-compose.yml down
Restart=on-failure
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable comp30022-app.service

# Optionally, start now so image contains running containers (not necessary)
# systemctl start comp30022-app.service

# Clean apt caches to reduce image size
apt-get clean
rm -rf /var/lib/apt/lists/*
