# 配置 DigitalOcean Provider
terraform {
  cloud {
    organization = "aniani"  # 替换为你的组织名
    workspaces {
      name = "forum"  # 替换为你的工作区名
    }
  }

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    # cloudflare = {
    #   source  = "cloudflare/cloudflare"
    #   version = "~> 4.0"
    # }
  }

  required_version = ">= 1.0.0"
}

# DigitalOcean provider
provider "digitalocean" {
  token = var.do_token
}

# Cloudflare provider
# provider "cloudflare" {
#   api_token = var.cloudflare_api_token
# }

# 创建 SSH key
resource "digitalocean_ssh_key" "default" {
  name       = "project-ssh-key"
  public_key = file(var.ssh_public_key_path)
}

# 创建 Droplet
resource "digitalocean_droplet" "web" {
  image     = "ubuntu-22-04-x64"
  name      = "aniani-staging"
  region    = "sgp1"  # 新加坡区域
  size      = "s-1vcpu-1gb"  # 基础配置
  ssh_keys  = [digitalocean_ssh_key.default.fingerprint]

  connection {
    type        = "ssh"
    user        = "root"
    host        = self.ipv4_address
    private_key = file("~/.ssh/terraform_id_rsa")
  }
  
  # 初始化脚本
  user_data = templatefile("${path.module}/scripts/setup.sh", {
    mongodb_uri = var.mongodb_uri
  })
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

# Cloudflare DNS 配置
# resource "cloudflare_zone" "domain" {
#   zone = var.domain_name
# }

# # A 记录指向 Droplet
# resource "cloudflare_record" "site" {
#   zone_id = cloudflare_zone.domain.id
#   name    = "@"
#   value   = digitalocean_droplet.web.ipv4_address
#   type    = "A"
#   proxied = true  # 启用 Cloudflare 代理
# }

# # www 子域名
# resource "cloudflare_record" "www" {
#   zone_id = cloudflare_zone.domain.id
#   name    = "www"
#   value   = digitalocean_droplet.web.ipv4_address
#   type    = "A"
#   proxied = true
# }

# # Cloudflare 页面规则
# resource "cloudflare_page_rule" "https" {
#   zone_id = cloudflare_zone.domain.id
#   target  = "*.${var.domain_name}/*"
#   actions {
#     always_use_https = true
#   }
# }

# # Cloudflare SSL 设置
# resource "cloudflare_zone_settings_override" "settings" {
#   zone_id = cloudflare_zone.domain.id
#   settings {
#     ssl = "strict"
#     always_use_https = "on"
#     min_tls_version = "1.2"
#   }
# } 
