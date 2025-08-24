resource "google_project_service" "compute" {
  project = var.project_id
  service = "compute.googleapis.com"
}


resource "google_compute_network" "vpc" {
  name                    = "${var.name}-vpc"
  auto_create_subnetworks = false
}


resource "google_compute_subnetwork" "subnet" {
  name          = "${var.name}-subnet"
  ip_cidr_range = var.cidr
  region        = var.region
  network       = google_compute_network.vpc.id
}

# Allow HTTP/HTTPS to instances tagged with var.web_tag
resource "google_compute_firewall" "allow_web" {
  name    = "${var.name}-allow-web"
  network = google_compute_network.vpc.name


  allow { protocol = "tcp"; ports = ["80", "443"] }
  direction     = "INGRESS"
  source_ranges = var.web_source_ranges
  target_tags = [var.web_tag]
}


# Allow SSH only from your IP(s)
# resource "google_compute_firewall" "allow_ssh" {
#   name    = "${var.name}-allow-ssh"
#   network = google_compute_network.vpc.name
#
#
#   allow { protocol = "tcp"; ports = ["22"] }
#   direction     = "INGRESS"
#   source_ranges = var.ssh_source_ranges
# }
