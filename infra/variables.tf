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
  description = "GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "app_name" {
  description = "Application name (used for resource naming)"
  type        = string
  default     = "comp30022-app"
}

variable "machine_type" {
  description = "VM machine type"
  type        = string
  default     = "e2-medium"
}

variable "preemptible" {
  description = "Use preemptible (spot) instances for cost savings"
  type        = bool
  default     = true
}

variable "mongo_username" {
  description = "MongoDB root username"
  type        = string
  default     = "admin"
}

variable "mongo_password" {
  description = "MongoDB root password"
  type        = string
  sensitive   = true
}

variable "credentials_file" {
  description = "Path to the service account key file (optional, for local development)"
  type        = string
  default     = null
}
