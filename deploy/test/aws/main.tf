terraform {
  required_version = ">= 1.3"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 6.0" }
  }
}

provider "aws" {
  region = var.region
}

# Log group for the ECS task
resource "aws_cloudwatch_log_group" "app" {
  name = "/ecs/${var.project_prefix}-app"

  tags = {
    Name = "${var.project_prefix}-app-logs"
  }
}

locals {
  # Common log configuration for all containers
  log_configuration = {
    logDriver = "awslogs"
    options = {
      "awslogs-group"         = aws_cloudwatch_log_group.app.name
      "awslogs-region"        = var.region
      "awslogs-stream-prefix" = "ecs"
    }
  }

  # Container definitions assembled as HCL objects and then jsonencoded
  containers = [
    {
      name             = "mongodb"
      image            = var.image_mongodb
      essential        = true
      portMappings     = [{ containerPort = 27017, protocol = "tcp" }]
      mountPoints      = [{ sourceVolume = "mongo-data", containerPath = "/data/db" }]
      environment      = []
      logConfiguration = local.log_configuration
    },

    {
      name             = "backend"
      image            = var.image_backend
      essential        = true
      portMappings     = [{ containerPort = 17000, protocol = "tcp" }]
      environment = [
        { name = "NODE_ENV", value = "development" },
        { name = "PORT", value = "17000" },
        { name = "MONGODB_URI", value = "mongodb://localhost:27017" },
        { name = "MONGODB_NAME", value = "ani" },
        # WARNING: Allowing all origins is insecure. For production, replace "*" with your specific domain.
        { name = "CORS_WHITELIST", value = "*" }
      ]
      logConfiguration = local.log_configuration
    },

    {
      name             = "nginx"
      image            = var.image_nginx
      essential        = true
      portMappings     = [{ containerPort = 80, protocol = "tcp" }]
      environment = [
        { name = "BACKEND_HOST", value = "localhost" },
        { name = "BACKEND_PORT", value = "17000" }
      ]
      logConfiguration = local.log_configuration
      # Health check for the nginx container itself is still useful
      healthCheck = {
        command   = ["CMD-SHELL", "curl -f http://localhost/ || exit 1"]
        interval  = 30
        timeout   = 5
        retries   = 3
        startPeriod = 30
      }
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

  volume {
    name = "mongo-data"
  }

  container_definitions = jsonencode(local.containers)
}

# ECS service that runs the task with public IP access
resource "aws_ecs_service" "app" {
  name            = "${var.project_prefix}-app-svc"
  cluster         = var.cluster_id != "" ? var.cluster_id : var.cluster_arn
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count

  depends_on = [aws_cloudwatch_log_group.app]

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = true
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
}

# Wait for the ECS task to be running and get its public IP
resource "null_resource" "get_task_ip" {
  depends_on = [aws_ecs_service.app]

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      
      # Wait for task to be in RUNNING state
      echo "Waiting for ECS task to be running..."
      for i in {1..60}; do
        TASK_ARN=$(aws ecs list-tasks \
          --cluster ${var.cluster_id != "" ? var.cluster_id : split("/", var.cluster_arn)[1]} \
          --service-name ${aws_ecs_service.app.name} \
          --desired-status RUNNING \
          --region ${var.region} \
          --query 'taskArns[0]' \
          --output text 2>/dev/null || echo "")
        
        if [ ! -z "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
          echo "Task found: $TASK_ARN"
          
          # Get ENI ID
          ENI_ID=$(aws ecs describe-tasks \
            --cluster ${var.cluster_id != "" ? var.cluster_id : split("/", var.cluster_arn)[1]} \
            --tasks $TASK_ARN \
            --region ${var.region} \
            --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
            --output text)
          
          if [ ! -z "$ENI_ID" ] && [ "$ENI_ID" != "None" ]; then
            echo "ENI found: $ENI_ID"
            
            # Get Public IP
            PUBLIC_IP=$(aws ec2 describe-network-interfaces \
              --network-interface-ids $ENI_ID \
              --region ${var.region} \
              --query 'NetworkInterfaces[0].Association.PublicIp' \
              --output text)
            
            if [ ! -z "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
              echo "Public IP found: $PUBLIC_IP"
              echo "$PUBLIC_IP" > ${path.module}/task_public_ip.txt
              exit 0
            fi
          fi
        fi
        
        echo "Attempt $i/60: Task not ready yet, waiting..."
        sleep 10
      done
      
      echo "ERROR: Failed to get task public IP after 10 minutes"
      exit 1
    EOT
  }

  triggers = {
    service_name = aws_ecs_service.app.name
    always_run   = timestamp()
  }
}

# Read the public IP from the file
data "local_file" "task_public_ip" {
  depends_on = [null_resource.get_task_ip]
  filename   = "${path.module}/task_public_ip.txt"
}
