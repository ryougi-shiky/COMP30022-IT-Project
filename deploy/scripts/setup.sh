#!/bin/bash

# 更新系统
apt-get update
apt-get upgrade -y

# 安装必要软件
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    docker.io

# 启动 Docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 创建应用目录
mkdir -p /app

# 获取服务器IP
SERVER_IP=\$(hostname -I | awk '{print \$1}')

# 设置Docker环境变量
cat > /app/.env <<EOT
MONGODB_URI=${mongodb_uri}
SERVER_IP=\$SERVER_IP
EOT

# 这里可以添加克隆代码、修改配置文件等步骤
# git clone your-repo-url /app

echo "服务器IP: \$SERVER_IP"
echo "配置完成"
EOF

chmod +x deploy/scripts/setup.sh
