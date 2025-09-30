variable "region" {
  type    = string
  default = "ap-northeast-1"
}

variable "project_prefix" {
  type    = string
  default = "comp30022"
}

variable "aws_account_id" {
  description = "AWS Account ID where the role will be created"
  type        = string
}

variable "image_nginx" {
  type = string
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
