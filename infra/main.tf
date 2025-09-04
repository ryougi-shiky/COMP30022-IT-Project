terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
  access_token = try(env.GOOGLE_OAUTH_ACCESS_TOKEN, null)
}

# 创建静态外部 IP
resource "google_compute_address" "vm_ip" {
  name   = "${var.vm_name}-ip"
  region = var.region
}

# 创建防火墙规则允许 3000 端口
resource "google_compute_firewall" "allow_app" {
  name    = "${var.vm_name}-allow-app"
  network = "default"

  allow {
    protocol = "tcp"
    ports = ["3000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags = ["app-server"]
}

# 创建防火墙规则允许 SSH
resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.vm_name}-allow-ssh"
  network = "default"

  allow {
    protocol = "tcp"
    ports = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags = ["app-server"]
}

# 创建 VM 实例
resource "google_compute_instance" "vm" {
  name         = var.vm_name
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["app-server"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 20
    }
  }

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.vm_ip.address
    }
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io docker-compose
    systemctl start docker
    systemctl enable docker
    usermod -aG docker $USER

    # 创建简单的测试应用
    mkdir -p /opt/app
    cat > /opt/app/package.json << 'EOL'
{
  "name": "test-app",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOL

    cat > /opt/app/server.js << 'EOL'
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from COMP30022 VM!',
    timestamp: new Date().toISOString(),
    hostname: require('os').hostname()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, '0.0.0.0', () => {
  console.log('App running on port ' + port);
});
EOL

    # 安装 Node.js
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs

    # 启动应用
    cd /opt/app
    npm install
    nohup node server.js > /var/log/app.log 2>&1 &
  EOF
}
