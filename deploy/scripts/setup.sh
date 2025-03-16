#!/bin/bash
# 初始化服务器脚本

# 更新系统
apt-get update
apt-get upgrade -y

# 安装必要软件
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    nginx \
    docker.io

# 启动 Docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 创建应用目录
mkdir -p /app 
