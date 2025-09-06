variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP AZ"
  type        = string
  default     = "us-central1-a"
}

variable "vm_name" {
  description = "VM instance name"
  type        = string
  default     = "aniani-vm-staging"
}

variable "machine_type" {
  description = "VM instance type"
  type        = string
  default     = "e2-small"
}

# Docker Hub info for pulling published images
variable "docker_hub_username" {
  description = "Docker Hub username for pulling images"
  type        = string
}

variable "docker_hub_password" {
  description = "Docker Hub password/token (optional if images are public)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "app_version" {
  description = "Image version/tag to deploy"
  type        = string
  default     = "latest"
}
