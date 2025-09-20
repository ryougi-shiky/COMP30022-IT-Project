terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
  access_token = try(get_env("GOOGLE_OAUTH_ACCESS_TOKEN", null), null)
  credentials = try(get_env("GOOGLE_APPLICATION_CREDENTIALS", null), null)
}

# Create static external IP
resource "google_compute_address" "vm_ip" {
  name   = "${var.vm_name}-ip"
  region = var.region
}

# Create firewall rule to allow 3000 port
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

# Create firewall rule to allow HTTP/HTTPS
resource "google_compute_firewall" "allow_http_https" {
  name    = "${var.vm_name}-allow-http-https"
  network = "default"

  allow {
    protocol = "tcp"
    ports = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags = ["app-server"]
}

# Create firewall rule to allow backend port for debugging
resource "google_compute_firewall" "allow_backend" {
  name    = "${var.vm_name}-allow-backend"
  network = "default"

  allow {
    protocol = "tcp"
    ports = ["17000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags = ["app-server"]
}

# Create firewall rule to allow SSH
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

# Create VM instance
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

  # Pass variables via instance metadata for the startup script to read
  metadata = {
    startup-script = file("${path.module}/startup.sh")
    docker-compose-yml = file("${path.module}/docker-compose.yml")
    DOCKER_HUB_USERNAME = var.docker_hub_username
    DOCKER_HUB_PASSWORD = var.docker_hub_password
    VERSION             = var.app_version
  }
}
