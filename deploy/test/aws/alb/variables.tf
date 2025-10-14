variable "region" {
  type    = string
  default = "ap-northeast-1"
}

variable "project_prefix" {
  type    = string
  default = "comp30022-test"
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

variable "vpc_id" {
  description = "The ID of the VPC where the ALB will be deployed"
  type        = string
}

variable "public_subnets" {
  description = "A list of public subnets where the ALB will be deployed"
  type        = list(string)
}
