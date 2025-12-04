# =============================================================================
# Production Environment Configuration
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for production state
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "blrplt/production/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

module "infrastructure" {
  source = "../../"

  # General
  project_name = "blrplt"
  environment  = "production"
  aws_region   = var.aws_region

  # VPC
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  # RDS - Production sizing
  db_instance_class    = "db.t3.small"
  db_allocated_storage = 50
  db_name              = "blrplt_db"
  db_username          = var.db_username
  db_password          = var.db_password

  # ElastiCache - Production sizing
  redis_node_type       = "cache.t3.small"
  redis_num_cache_nodes = 1

  # ECS - Production sizing
  server_cpu           = 1024
  server_memory        = 2048
  server_desired_count = 2

  # Secrets
  jwt_secret         = var.jwt_secret
  jwt_refresh_secret = var.jwt_refresh_secret

  # Domain configuration
  domain_name               = var.domain_name
  client_domain_aliases     = var.client_domain_aliases
  admin_domain_aliases      = var.admin_domain_aliases
  acm_certificate_arn       = var.acm_certificate_arn
  cloudfront_certificate_arn = var.cloudfront_certificate_arn
  create_route53_records    = var.create_route53_records

  # WAF
  waf_rate_limit = 2000
}
