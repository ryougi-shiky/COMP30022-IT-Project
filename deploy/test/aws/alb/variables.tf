variable "region" {
  type    = string
  default = "ap-northeast-1"
}

variable "project_prefix" {
  type    = string
  default = "comp30022-test"
}

variable "vpc_id" {
  description = "The ID of the VPC where the ALB will be deployed"
  type        = string
}

variable "public_subnets" {
  description = "A list of public subnets where the ALB will be deployed"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "The ID of the ECS service's security group"
  type        = string
}
