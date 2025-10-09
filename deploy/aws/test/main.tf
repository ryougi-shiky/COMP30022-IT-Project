terraform {
  required_version = ">= 1.3"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 6.0" }
  }
}

provider "aws" {
  region = var.region
}

locals {
  # Container definitions assembled as HCL objects and then jsonencoded
  containers = [
    {
      name  = "mongodb"
      image = "${var.image_mongodb}"
      essential = true
      portMappings = [
        { containerPort = 27017, protocol = "tcp" }
      ]
      # mount the named "mongo-data" volume to /data/db
      mountPoints = [
        { sourceVolume = "mongo-data", containerPath = "/data/db" }
      ]
      environment = []
    },

    {
      name  = "backend"
      image = "${var.image_backend}"
      essential = true
      portMappings = [
        { containerPort = 17000, protocol = "tcp" }
      ]
      environment = [
        { name = "NODE_ENV", value = "development" },
        { name = "PORT", value = "17000" },
        # backend can connect to mongodb via internal container hostname (mongodb) since same task
        { name = "MONGODB_URI", value = "mongodb://localhost:27017" }, # use localhost because containers in same task share network namespace
        { name = "MONGODB_NAME", value = "ani" },
        { name = "CORS_WHITELIST", value = "http://localhost:3000" }
      ]
    },

    {
      name  = "nginx"
      image = "${var.image_nginx}"
      essential = true
      portMappings = [
        { containerPort = 80, protocol = "tcp" } # ALB will target this port
      ]
      environment = []
    }
  ]
}

# Task definition that contains mongodb + backend + nginx as separate containers
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_prefix}-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.container_cpu)      # task-level CPU
  memory                   = tostring(var.container_memory)   # task-level memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = length(var.task_role_arn) > 0 ? var.task_role_arn : null

  # ephemeral volume for mongo data (not persistent across task replacement)
  volume {
    name = "mongo-data"
    # No efs config -> ephemeral volume for Fargate
  }

  container_definitions = jsonencode(local.containers)
}

# ECS service that runs the task and registers nginx container in the provided ALB target group
resource "aws_ecs_service" "app" {
  name            = "${var.project_prefix}-app-svc"
  cluster         = var.cluster_id != "" ? var.cluster_id : var.cluster_arn
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = true
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }

  # point the ALB target group to the nginx container port (80)
  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "nginx"
    container_port   = 80
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  depends_on = []
}
