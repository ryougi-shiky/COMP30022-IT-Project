# =====================
# ECS Cluster
# =====================
output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.cluster.arn
}

output "cluster_id" {
  description = "Name (ID) of the ECS cluster"
  value       = aws_ecs_cluster.cluster.name
}

# =====================
# VPC & Networking
# =====================
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnets" {
  description = "List of public subnet IDs for ECS tasks or ALB"
  value       = module.vpc.public_subnets
}

output "security_group_ids" {
  description = "ECS security group IDs"
  value       = [aws_security_group.ecs.id]
}

# =====================
# IAM Roles
# =====================
output "execution_role_arn" {
  description = "IAM role ARN for ECS task execution"
  value       = aws_iam_role.ecs_task_execution.arn
}
