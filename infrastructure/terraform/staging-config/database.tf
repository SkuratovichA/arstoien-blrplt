# =============================================================================
# Database Resources - RDS PostgreSQL, ElastiCache Redis
# =============================================================================

# -----------------------------------------------------------------------------
# VPC Data Sources
# -----------------------------------------------------------------------------

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# -----------------------------------------------------------------------------
# RDS PostgreSQL (Optional)
# -----------------------------------------------------------------------------

resource "aws_db_subnet_group" "postgres" {
  count      = var.create_rds ? 1 : 0
  name       = "${var.project_name}-postgres"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "${var.project_name}-postgres"
  }
}

resource "aws_security_group" "postgres" {
  count       = var.create_rds ? 1 : 0
  name        = "${var.project_name}-postgres"
  description = "Security group for PostgreSQL"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Allow public access (App Runner will connect from AWS IPs)
    description = "Allow PostgreSQL connections (secured by password)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-postgres"
  }
}

resource "aws_db_instance" "postgres" {
  count = var.create_rds ? 1 : 0

  identifier     = "${var.project_name}-postgres"
  engine         = "postgres"
  engine_version = "15"

  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  storage_type      = "gp2"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.postgres[0].name
  vpc_security_group_ids = [aws_security_group.postgres[0].id]

  # Cost optimization
  multi_az                = false
  publicly_accessible     = true  # Changed to allow App Runner access without VPC connector
  skip_final_snapshot     = true
  deletion_protection     = false
  backup_retention_period = 7

  tags = {
    Name = "${var.project_name}-postgres"
  }
}

# Security group for App Runner to access RDS
resource "aws_security_group" "apprunner" {
  count       = var.create_rds ? 1 : 0
  name        = "${var.project_name}-apprunner"
  description = "Security group for App Runner service"
  vpc_id      = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-apprunner"
  }
}

# -----------------------------------------------------------------------------
# ElastiCache Redis (Optional)
# -----------------------------------------------------------------------------

resource "aws_elasticache_subnet_group" "redis" {
  count      = var.enable_redis ? 1 : 0
  name       = "${var.project_name}-redis"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_security_group" "redis" {
  count       = var.enable_redis ? 1 : 0
  name        = "${var.project_name}-redis"
  description = "Security group for Redis"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_cluster" "redis" {
  count                = var.enable_redis ? 1 : 0
  cluster_id           = "${var.project_name}-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis[0].name
  security_group_ids   = [aws_security_group.redis[0].id]
}

# -----------------------------------------------------------------------------
# Computed Database URL
# -----------------------------------------------------------------------------

locals {
  database_url = var.create_rds ? "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres[0].endpoint}/${var.db_name}" : var.database_url
}
