data "google_compute_image" "debian" {
  family  = var.image_family
  project = var.image_project
}


resource "google_compute_address" "static" {
  name   = "${var.name}-ip"
  region = var.region
}


resource "google_compute_instance" "vm" {
  name         = var.name
  zone         = var.zone
  machine_type = var.machine_type


  tags = var.network_tags


  boot_disk {
    initialize_params {
      image = data.google_compute_image.debian.self_link
      size  = var.disk_size_gb
      type  = "pd-balanced"
    }
  }


  network_interface {
    subnetwork = var.subnet_self_link
    access_config {
      nat_ip = google_compute_address.static.address
    }
  }


  scheduling {
    preemptible        = var.preemptible
    automatic_restart  = var.preemptible ? false : true
    provisioning_model = var.preemptible ? "SPOT" : "STANDARD"
  }


  metadata = {
    "startup-script" = templatefile("${path.module}/startup.sh.tftpl", {
      compose_yml = templatefile("${path.module}/docker-compose.tftpl", {
        mongo_root_username = var.mongo_root_username,
        mongo_root_password = var.mongo_root_password
      })
    })
  }


  dynamic "service_account" {
    for_each = var.service_account_email == null ? [] : [1]
    content {
      email = var.service_account_email
      scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    }
  }
}
