output "task_definition_arn" {
  value = aws_ecs_task_definition.app.arn
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}

output "ecs_service_arn" {
  value = aws_ecs_service.app.arn
}

output "alb_target_group_arn" {
  value = aws_lb_target_group.nginx_tg.arn
}
