output "task_definition_arn" {
  value = aws_ecs_task_definition.app.arn
}

output "ecs_service_name" {
  value = nonsensitive(aws_ecs_service.app.name)
}

output "ecs_service_arn" {
  value = nonsensitive(aws_ecs_service.app.arn)
}
