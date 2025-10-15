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
