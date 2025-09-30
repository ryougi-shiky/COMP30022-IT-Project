terraform {
  required_version = ">= 1.3"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 6.0" }
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
  public_subnets     = ["10.0.1.0/24", "10.0.2.0/24"]
  enable_nat_gateway = false
  tags = { Environment = "test" }
}

module "github_actions_oidc_role" {
  source = "../../modules/github-actions-oidc-role/aws/iam-test"

  aws_account_id = "219396432881"
  github_owner   = "ryougi-shiky"
  github_repo    = "COMP30022-IT-Project"
  github_branch  = "deploy-test-app"
}


data "aws_availability_zones" "available" {}

data "aws_iam_policy" "github_actions_ecs_policy" {
  arn = "arn:aws:iam::${var.aws_account_id}:policy/GitHubActionsTerraformRolePolicy"
}

# ---------- ECS Cluster ----------
resource "aws_ecs_cluster" "cluster" {
  name = "${var.project_prefix}-test-cluster"
}

# ---------- IAM Roles ----------
data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    principals {
      type        = "Service"
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

# ---------- Security Groups ----------
resource "aws_security_group" "alb" {
  name   = "${var.project_prefix}-alb-sg"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs" {
  name   = "${var.project_prefix}-ecs-sg"
  vpc_id = module.vpc.vpc_id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}