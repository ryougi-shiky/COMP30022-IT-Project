# 配置 DigitalOcean Provider
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# 创建 SSH key
resource "digitalocean_ssh_key" "default" {
  name       = "project-ssh-key"
  public_key = file(var.ssh_public_key_path)
}

# 创建 Droplet
resource "digitalocean_droplet" "web" {
  image     = "ubuntu-22-04-x64"
  name      = "web-app"
  region    = "sgp1"  # 新加坡区域
  size      = "s-1vcpu-1gb"  # 基础配置
  ssh_keys  = [digitalocean_ssh_key.default.fingerprint]

  # 初始化脚本
  user_data = file("${path.module}/scripts/setup.sh")
}

# 创建防火墙
resource "digitalocean_firewall" "web" {
  name = "web-firewall"

  droplet_ids = [digitalocean_droplet.web.id]

  # 允许 SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # 允许 HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # 允许 HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # 允许所有出站流量
  outbound_rule {
    protocol              = "tcp"
    port_range           = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
} 
