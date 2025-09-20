# packer/image.pkr.hcl
variable "project_id" { type = string }
variable "zone"       { type = string }
variable "image_name" { type = string }
variable "image_family" { type = string default = "" }
variable "access_token" { type = string, default = "" } # CI pass WIF token

source "googlecompute" "ubuntu" {
  project_id           = var.project_id
  zone                 = var.zone
  source_image_family  = "ubuntu-2204-lts"
  machine_type         = "e2-small"
  disk_size_gb         = 20

  # Name of the resulting image
  image_name           = var.image_name
  # optional image_family = var.image_family
  # you can pass an access_token here (packer supports it)
  access_token         = var.access_token
}

build {
  name    = "gcp-custom-image"
  sources = ["source.googlecompute.ubuntu"]

  provisioner "file" {
    source      = "scripts/provision.sh"
    destination = "/tmp/provision.sh"
  }

  provisioner "shell" {
    inline = [
      "chmod +x /tmp/provision.sh",
      "/tmp/provision.sh"
    ]
  }
}
