# Enable required APIs
resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
}

# Create VPC network
resource "google_compute_network" "vpc" {
  name                    = "${var.app_name}-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.compute]
}

# Create subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "${var.app_name}-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# Create firewall rule for HTTP/HTTPS
resource "google_compute_firewall" "allow_web" {
  name    = "${var.app_name}-allow-web"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "3000"]  # Include 3000 for React dev server
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]
}

# Create firewall rule for SSH
resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.app_name}-allow-ssh"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]  # Consider restricting this in production
  target_tags   = ["web-server"]
}

# Reserve static IP
resource "google_compute_address" "static_ip" {
  name   = "${var.app_name}-ip"
  region = var.region
}

# Create VM instance
resource "google_compute_instance" "app_server" {
  name         = "${var.app_name}-server"
  machine_type = var.machine_type
  zone         = var.zone
  tags         = ["web-server"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 20
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    access_config {
      nat_ip = google_compute_address.static_ip.address
    }
  }

  # Use preemptible instance for cost savings
  scheduling {
    preemptible        = var.preemptible
    automatic_restart  = !var.preemptible
    provisioning_model = var.preemptible ? "SPOT" : "STANDARD"
  }

  metadata_startup_script = templatefile("${path.module}/startup.sh", {
    mongo_username = var.mongo_username
    mongo_password = var.mongo_password
  })

  depends_on = [
    google_compute_subnetwork.subnet,
    google_compute_firewall.allow_web,
    google_compute_firewall.allow_ssh
  ]
}
