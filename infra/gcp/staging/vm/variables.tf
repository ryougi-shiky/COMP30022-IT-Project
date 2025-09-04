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
  default     = "comp30022-vm-staging"
}

variable "machine_type" {
  description = "VM instance type"
  type        = string
  default     = "e2-small"
}
