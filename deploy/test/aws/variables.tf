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


variable "cluster_arn" {
  type        = string
  description = "Existing ECS cluster ARN (created by infra)"
}

variable "cluster_id" {
  type        = string
  description = "Existing ECS cluster id (short name). If you only have ARN, pass the cluster name/ID here."
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet ids for tasks (private/public subnets) - provided by infra"
}

variable "security_group_ids" {
  type        = list(string)
  description = "Security group ids to attach to tasks (should allow needed egress and ALB ingress). Provided by infra."
}

variable "alb_target_group_arn" {
  type        = string
  description = "ALB Target Group ARN (nginx target) created in infra"
}

variable "execution_role_arn" {
  type        = string
  description = "ECS task execution role ARN (AmazonECSTaskExecutionRolePolicy attached) created in infra"
}

variable "task_role_arn" {
  type        = string
  description = "Optional task role ARN (for app permissions). Leave empty if not needed."
  default     = ""
}

variable "container_cpu" {
  type    = number
  default = 256
}

variable "container_memory" {
  type    = number
  default = 1024
}

