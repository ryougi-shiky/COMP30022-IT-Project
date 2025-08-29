locals {
  name = "comp30022-${var.environment}"
}

# Create the network infrastructure
module "network" {
  source = "../../modules/network"

  name       = local.name
  project_id = var.project_id
  region     = var.region
  cidr       = "10.0.0.0/24"

  web_tag            = "web-server"
  web_source_ranges  = ["0.0.0.0/0"]  # Allow HTTP/HTTPS from anywhere
  ssh_source_ranges  = ["0.0.0.0/0"]  # Allow SSH from anywhere (consider restricting this)
}

# Create the VM instance
module "vm" {
  source = "../../modules/vm"

  name         = local.name
  project_id   = var.project_id
  zone         = var.zone
  region       = var.region
  machine_type = "e2-medium"

  # Network configuration
  subnet_self_link = module.network.subnet_self_link
  network_tags     = ["web-server"]

  # Disk configuration
  image_family  = "debian-12"
  image_project = "debian-cloud"
  disk_size_gb  = 20

  # Cost optimization
  preemptible = true

  # Application configuration
  mongo_root_username = var.mongo_root_username
  mongo_root_password = var.mongo_root_password

  # Dependencies
  depends_on = [module.network]
}
