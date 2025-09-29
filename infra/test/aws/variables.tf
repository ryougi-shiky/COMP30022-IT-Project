variable "region" {
  type    = string
  default = "ap-southeast-1"
}

variable "project_prefix" {
  type    = string
  default = "comp30022"
}

variable "image_nginx" {
  type = string
  # e.g. "youruser/forum-nginx:latest"
}

variable "image_backend" {
  type = string
}

variable "image_mongodb" {
  type = string
}

variable "desired_count" {
  type    = number
  default = 1
}
