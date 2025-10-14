terraform {
  required_version = ">= 1.3"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 6.0" }
  }
}

provider "aws" {
  region = var.region
}

# ---------- Security Groups ----------
resource "aws_security_group" "alb" {
  name   = "${var.project_prefix}-alb-sg"
  vpc_id = var.vpc_id
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

# This rule is added to the ECS security group (created in the infra module)
# to allow traffic from the ALB security group.
resource "aws_security_group_rule" "allow_alb_to_ecs" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  security_group_id        = var.ecs_security_group_id
  source_security_group_id = aws_security_group.alb.id
  description              = "Allow HTTP traffic from ALB to ECS"
}


# ---------- ALB ----------
resource "aws_lb" "alb" {
  name               = "${var.project_prefix}-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnets
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "nginx_tg" {
  name        = "${var.project_prefix}-nginx-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  health_check {
    path = "/healthcheck"
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
