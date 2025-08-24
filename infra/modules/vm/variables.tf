variable "name" { type = string }
variable "project_id" { type = string }
variable "region" { type = string }
variable "zone" { type = string }
variable "subnet_self_link"{ type = string }
variable "network_tags" { type = list(string) }
variable "machine_type" { type = string default = "e2-small" }
variable "disk_size_gb" { type = number default = 20 }
variable "preemptible" { type = bool default = false }
variable "service_account_email" { type = string, default = null }


# Compose template inputs (example)
variable "mongo_root_username" { type = string default = "root" }
variable "mongo_root_password" { type = string }


# Optional: use a specific image family
variable "image_family" { type = string default = "debian-12" }
variable "image_project"{ type = string default = "debian-cloud" }
