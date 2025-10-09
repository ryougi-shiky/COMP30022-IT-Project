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
output "subnet_ids" {
  description = "List of public subnet IDs for ECS tasks or ALB"
  value       = module.vpc.public_subnets
}

output "security_group_ids" {
  description = "ECS security group IDs"
  value       = [aws_security_group.ecs.id]
}

# =====================
# ALB
# =====================
output "alb_target_group_arn" {
  description = "Target group ARN for Nginx service"
  value       = aws_lb_target_group.nginx_tg.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.alb.dns_name
}

# =====================
# IAM Roles
# =====================
output "execution_role_arn" {
  description = "IAM role ARN for ECS task execution"
  value       = aws_iam_role.ecs_task_execution.arn
}
