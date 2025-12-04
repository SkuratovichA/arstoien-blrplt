# =============================================================================
# PR Preview Environment Configuration
# =============================================================================
# Lightweight infrastructure for PR preview deployments
# - Single ECS task with public IP (no ALB)
# - S3 for static hosting with public access
# - Shared RDS and Redis from production
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend - use unique key per PR
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "blrplt/preview/${PR_NUMBER}/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "blrplt"
      Environment = "preview"
      PR          = var.pr_number
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name_prefix = "blrplt-pr-${var.pr_number}"
}

# =============================================================================
# Data Sources - Reference existing production resources
# =============================================================================

data "aws_vpc" "production" {
  tags = {
    Name = "blrplt-production-vpc"
  }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.production.id]
  }

  tags = {
    Type = "public"
  }
}

data "aws_ecr_repository" "server" {
  name = "blrplt-production-server"
}

# =============================================================================
# S3 Buckets for Preview Static Files
# =============================================================================

resource "aws_s3_bucket" "client" {
  bucket = "${local.name_prefix}-client"

  tags = {
    Name = "${local.name_prefix}-client"
  }
}

resource "aws_s3_bucket" "admin" {
  bucket = "${local.name_prefix}-admin"

  tags = {
    Name = "${local.name_prefix}-admin"
  }
}

# Enable static website hosting
resource "aws_s3_bucket_website_configuration" "client" {
  bucket = aws_s3_bucket.client.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_website_configuration" "admin" {
  bucket = aws_s3_bucket.admin.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Public access for preview environments
resource "aws_s3_bucket_public_access_block" "client" {
  bucket = aws_s3_bucket.client.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "admin" {
  bucket = aws_s3_bucket.admin.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "client" {
  bucket = aws_s3_bucket.client.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.client.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.client]
}

resource "aws_s3_bucket_policy" "admin" {
  bucket = aws_s3_bucket.admin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.admin.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.admin]
}

# =============================================================================
# ECS Task for Preview Server (No Load Balancer)
# =============================================================================

resource "aws_security_group" "preview_server" {
  name        = "${local.name_prefix}-server-sg"
  description = "Security group for preview server"
  vpc_id      = data.aws_vpc.production.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-server-sg"
  }
}

resource "aws_cloudwatch_log_group" "server" {
  name              = "/ecs/${local.name_prefix}/server"
  retention_in_days = 7

  tags = {
    Name = "${local.name_prefix}-logs"
  }
}

resource "aws_ecs_task_definition" "server" {
  family                   = "${local.name_prefix}-server"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name  = "server"
      image = "${data.aws_ecr_repository.server.repository_url}:pr-${var.pr_number}"

      essential = true

      portMappings = [
        {
          containerPort = 4000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "preview" },
        { name = "PORT", value = "4000" },
        { name = "DATABASE_URL", value = var.database_url },
        { name = "REDIS_URL", value = var.redis_url },
        { name = "JWT_SECRET", value = var.jwt_secret },
        { name = "JWT_REFRESH_SECRET", value = var.jwt_refresh_secret },
        { name = "FRONTEND_URL", value = "http://${aws_s3_bucket_website_configuration.client.website_endpoint}" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.server.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${local.name_prefix}-server"
  }
}

# Use ECS Service with public IP
resource "aws_ecs_service" "server" {
  name            = "${local.name_prefix}-server"
  cluster         = var.ecs_cluster_arn
  task_definition = aws_ecs_task_definition.server.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.public.ids
    security_groups  = [aws_security_group.preview_server.id]
    assign_public_ip = true
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 0
  }

  tags = {
    Name = "${local.name_prefix}-server"
  }
}
