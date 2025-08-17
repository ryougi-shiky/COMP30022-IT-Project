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
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
}

variable "zone" {
  description = "GCP Zone"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "credentials_file" {
  description = "Path to GCP service account credentials JSON file"
  type        = string
  default     = ""
}

variable "network_name" {
  description = "VPC network name"
  type        = string
}

variable "subnet_name" {
  description = "Subnet name"
  type        = string
}

variable "subnet_cidr" {
  description = "Subnet CIDR range"
  type        = string
}

variable "machine_type" {
  description = "Machine type for instances"
  type        = string
}

variable "disk_size" {
  description = "Boot disk size in GB"
  type        = number
}

variable "docker_images" {
  description = "Docker images for services"
  type = object({
    frontend = string
    backend  = string
    database = string
  })
}

variable "instance_names" {
  description = "Names for compute instances"
  type = object({
    frontend = string
    backend  = string
    database = string
  })
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = var.network_name
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "main" {
  name          = var.subnet_name
  ip_cidr_range = var.subnet_cidr
  region        = var.region
  network       = google_compute_network.main.id
}

# Firewall Rules
resource "google_compute_firewall" "allow_http" {
  name    = "${var.network_name}-allow-http"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["frontend"]
}

resource "google_compute_firewall" "allow_internal" {
  name    = "${var.network_name}-allow-internal"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["5000", "27017"]
  }

  source_tags = ["frontend", "backend"]
  target_tags = ["backend", "database"]
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.network_name}-allow-ssh"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["frontend", "backend", "database"]
}

# Database Instance
resource "google_compute_instance" "database" {
  name         = var.instance_names.database
  machine_type = var.machine_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = var.disk_size
    }
  }

  network_interface {
    network    = google_compute_network.main.id
    subnetwork = google_compute_subnetwork.main.id
  }

  metadata_startup_script = templatefile("${path.module}/scripts/database.sh", {
    mongo_image = var.docker_images.database
  })

  tags = ["database"]
}

# Backend Instance
resource "google_compute_instance" "backend" {
  name         = var.instance_names.backend
  machine_type = var.machine_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = var.disk_size
    }
  }

  network_interface {
    network    = google_compute_network.main.id
    subnetwork = google_compute_subnetwork.main.id
  }

  metadata_startup_script = templatefile("${path.module}/scripts/backend.sh", {
    backend_image = var.docker_images.backend
    database_ip   = google_compute_instance.database.network_interface[0].network_ip
  })

  tags = ["backend"]
  depends_on = [google_compute_instance.database]
}

# Frontend Instance
resource "google_compute_instance" "frontend" {
  name         = var.instance_names.frontend
  machine_type = var.machine_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = var.disk_size
    }
  }

  network_interface {
    network    = google_compute_network.main.id
    subnetwork = google_compute_subnetwork.main.id
    access_config {
      // Ephemeral public IP
    }
  }

  metadata_startup_script = templatefile("${path.module}/scripts/frontend.sh", {
    frontend_image = var.docker_images.frontend
    backend_ip     = google_compute_instance.backend.network_interface[0].network_ip
  })

  tags = ["frontend"]
  depends_on = [google_compute_instance.backend]
}

# Outputs
output "frontend_public_ip" {
  description = "Public IP of frontend server"
  value       = google_compute_instance.frontend.network_interface[0].access_config[0].nat_ip
}

output "application_url" {
  description = "Application URL"
  value       = "http://${google_compute_instance.frontend.network_interface[0].access_config[0].nat_ip}"
}

output "backend_internal_ip" {
  description = "Internal IP of backend server"
  value       = google_compute_instance.backend.network_interface[0].network_ip
}

output "database_internal_ip" {
  description = "Internal IP of database server"
  value       = google_compute_instance.database.network_interface[0].network_ip
}
