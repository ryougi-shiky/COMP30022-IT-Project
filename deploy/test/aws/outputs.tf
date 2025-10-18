output "task_definition_arn" {
  value = aws_ecs_task_definition.app.arn
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}

output "ecs_service_arn" {
  value = aws_ecs_service.app.arn
}

output "cluster_name" {
  description = "ECS cluster name for querying task details"
  value       = var.cluster_id != "" ? var.cluster_id : split("/", var.cluster_arn)[1]
}

output "task_public_ip" {
  description = "Public IP address of the ECS task"
  value       = trimspace(data.local_file.task_public_ip.content)
}
