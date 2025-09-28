terraform {
  required_version = ">= 1.3"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.region
}

# ---------- VPC (use module for brevity) ----------
module "vpc" {
  source             = "terraform-aws-modules/vpc/aws"
  version            = ">= 3.0"
  name               = "${var.project_prefix}-vpc"
  cidr               = "10.0.0.0/16"
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  enable_nat_gateway = false
  tags = { Environment = "test" }
}

module "github_actions_oidc_role" {
  source = "../../modules/github-actions-oidc-role/aws/iam-test"

  aws_account_id = "219396432881"
  github_owner   = "ryougi-shiky"
  github_repo    = "COMP30022-IT-Project"
  github_branch  = "deploy-app-staging"
}


data "aws_availability_zones" "available" {}

# ---------- ECS Cluster ----------
resource "aws_ecs_cluster" "cluster" {
  name = "${var.project_prefix}-test-cluster"
}

# ---------- IAM roles ----------
data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    principals {
      type = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name               = "${var.project_prefix}-ecs-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
}
resource "aws_iam_role_policy_attachment" "exec_attach" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ---------- SecretsManager: DockerHub credentials (for private DockerHub) ----------
resource "aws_secretsmanager_secret" "dockerhub" {
  name = "${var.project_prefix}-dockerhub"
}
resource "aws_secretsmanager_secret_version" "dockerhub_version" {
  secret_id = aws_secretsmanager_secret.dockerhub.id
  secret_string = jsonencode({
    username = var.docker_hub_username
    password = var.docker_hub_password
  })
}

# ---------- Security Groups ----------
resource "aws_security_group" "alb" {
  name   = "${var.project_prefix}-alb-sg"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port = 80
    to_port   = 80
    protocol  = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs" {
  name   = "${var.project_prefix}-ecs-sg"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port = 3000
    to_port   = 3000
    protocol  = "tcp"
    security_groups = [aws_security_group.alb.id] # only ALB -> nginx
  }
  ingress {
    from_port = 17000
    to_port   = 17000
    protocol  = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # backend public for test; tighten in prod
  }
  ingress {
    from_port = 27017
    to_port   = 27017
    protocol  = "tcp"
    security_groups = [aws_security_group.ecs.id] # allow self (mongodb)
  }
  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ---------- ALB ----------
resource "aws_lb" "alb" {
  name               = "${var.project_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
}

resource "aws_lb_target_group" "nginx_tg" {
  name     = "${var.project_prefix}-nginx-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  health_check {
    path     = "/health"
    interval = 30
    matcher  = "200-399"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nginx_tg.arn
  }
}

# ---------- EFS for MongoDB persistence ----------
resource "aws_efs_file_system" "mongo" {
  creation_token = "${var.project_prefix}-mongo"
  tags = { Name = "${var.project_prefix}-mongo-efs" }
}

resource "aws_efs_access_point" "mongo_ap" {
  file_system_id = aws_efs_file_system.mongo.id
  posix_user {
    uid = 1000
    gid = 1000
  }
  root_directory { path = "/mongodb" }
}

# create mount targets for each public subnet
resource "aws_efs_mount_target" "mt" {
  for_each = toset(module.vpc.public_subnets)
  file_system_id = aws_efs_file_system.mongo.id
  subnet_id      = each.key
  security_groups = [aws_security_group.ecs.id]
}

# ---------- ECS Task Definitions ----------
# helper: container definitions as JSON
locals {
  backend_container = [
    {
      name      = "backend"
      image     = var.image_backend
      essential = true
      portMappings = [{ containerPort = 17000 }]
      environment = [
        { name = "CORS_WHITELIST", value = "http://localhost:3000" },
        { name = "MONGODB_NAME", value = "ani" },
        { name = "MONGODB_URI", value = "mongodb://mongodb:27017" },
        { name = "NODE_ENV", value = "development" },
        { name = "PORT", value = "17000" }
      ]
    }
  ]

  mongodb_container = [
    {
      name      = "mongodb"
      image     = var.image_mongodb
      essential = true
      portMappings = [{ containerPort = 27017 }]
      mountPoints = [
        {
          sourceVolume = "mongo-data",
          containerPath = "/data/db"
        }
      ]
    }
  ]

  nginx_container = [
    {
      name      = "nginx"
      image     = var.image_nginx
      essential = true
      portMappings = [{ containerPort = 3000 }]
    }
  ]
}

# backend task
resource "aws_ecs_task_definition" "backend" {
  family             = "${var.project_prefix}-backend"
  requires_compatibilities = ["FARGATE"]
  cpu                = "256"
  memory             = "512"
  network_mode       = "awsvpc"
  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  container_definitions = jsonencode(local.backend_container)
  # if dockerhub private, must reference repository_credentials at service level
}

# mongodb task - with efs volume
resource "aws_ecs_task_definition" "mongodb" {
  family             = "${var.project_prefix}-mongodb"
  requires_compatibilities = ["FARGATE"]
  cpu                = "256"
  memory             = "512"
  network_mode       = "awsvpc"
  execution_role_arn = aws_iam_role.ecs_task_execution.arn

  volume {
    name = "mongo-data"
    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.mongo.id
      transit_encryption = "ENABLED"
      authorization_config {
        access_point_id = aws_efs_access_point.mongo_ap.id
        iam = "DISABLED"
      }
    }
  }

  container_definitions = jsonencode(local.mongodb_container)
}

# nginx task
resource "aws_ecs_task_definition" "nginx" {
  family             = "${var.project_prefix}-nginx"
  requires_compatibilities = ["FARGATE"]
  cpu                = "256"
  memory             = "512"
  network_mode       = "awsvpc"
  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  container_definitions = jsonencode(local.nginx_container)
}

# ---------- ECS Services (use FARGATE_SPOT capacity provider) ----------
resource "aws_ecs_service" "mongodb" {
  name            = "${var.project_prefix}-mongodb-svc"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.mongodb.arn
  desired_count   = var.desired_count

  launch_type = "FARGATE"
  network_configuration {
    subnets          = module.vpc.public_subnets
    security_groups = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }
}

resource "aws_ecs_service" "backend" {
  name            = "${var.project_prefix}-backend-svc"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count

  launch_type = "FARGATE"
  network_configuration {
    subnets          = module.vpc.public_subnets
    security_groups = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }
}

resource "aws_ecs_service" "nginx" {
  name            = "${var.project_prefix}-nginx-svc"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.nginx.arn
  desired_count   = var.desired_count

  launch_type = "FARGATE"
  network_configuration {
    subnets          = module.vpc.public_subnets
    security_groups = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.nginx_tg.arn
    container_name   = "nginx"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]
}

# If DockerHub is private: attach repository credentials to services (ECS supports repository_credentials only at task_definition.container_definitions container level in newer providers).
# Simpler: use public images or push to ECR.
