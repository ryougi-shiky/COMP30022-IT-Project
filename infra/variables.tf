variable "project_id" {
  description = "GCP 项目 ID"
  type        = string
}

variable "region" {
  description = "GCP 区域"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP 可用区"
  type        = string
  default     = "us-central1-a"
}

variable "vm_name" {
  description = "VM 实例名称"
  type        = string
  default     = "comp30022-vm"
}

variable "machine_type" {
  description = "VM 机器类型"
  type        = string
  default     = "e2-medium"
}
