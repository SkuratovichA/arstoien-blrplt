# =============================================================================
# Main Terraform Configuration
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Backend configuration - uncomment and configure for remote state
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "blrplt/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Secondary provider for CloudFront (must be in us-east-1 for ACM certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# =============================================================================
# Local Variables
# =============================================================================

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# =============================================================================
# VPC Module
# =============================================================================

module "vpc" {
  source = "./modules/vpc"

  name_prefix         = local.name_prefix
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones

  tags = local.common_tags
}

# =============================================================================
# ECR Repositories
# =============================================================================

module "ecr" {
  source = "./modules/ecr"

  name_prefix = local.name_prefix

  tags = local.common_tags
}

# =============================================================================
# RDS PostgreSQL
# =============================================================================

module "rds" {
  source = "./modules/rds"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids

  db_instance_class     = var.db_instance_class
  db_allocated_storage  = var.db_allocated_storage
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password

  allowed_security_groups = [module.ecs.ecs_security_group_id]

  tags = local.common_tags
}

# =============================================================================
# ElastiCache Redis
# =============================================================================

module "elasticache" {
  source = "./modules/elasticache"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids

  node_type             = var.redis_node_type
  num_cache_nodes       = var.redis_num_cache_nodes

  allowed_security_groups = [module.ecs.ecs_security_group_id]

  tags = local.common_tags
}

# =============================================================================
# S3 Buckets
# =============================================================================

module "s3" {
  source = "./modules/s3"

  name_prefix = local.name_prefix
  environment = var.environment

  tags = local.common_tags
}

# =============================================================================
# Application Load Balancer
# =============================================================================

module "alb" {
  source = "./modules/alb"

  name_prefix       = local.name_prefix
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids

  certificate_arn   = var.acm_certificate_arn

  tags = local.common_tags
}

# =============================================================================
# ECS Cluster and Services
# =============================================================================

module "ecs" {
  source = "./modules/ecs"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids

  # ECR repositories
  server_ecr_url        = module.ecr.server_repository_url

  # ALB configuration
  alb_security_group_id = module.alb.security_group_id
  server_target_group_arn = module.alb.server_target_group_arn

  # Database configuration
  database_url          = module.rds.connection_string
  redis_url             = module.elasticache.connection_string

  # S3 configuration
  uploads_bucket        = module.s3.uploads_bucket_name

  # Application configuration
  server_cpu            = var.server_cpu
  server_memory         = var.server_memory
  server_desired_count  = var.server_desired_count

  # Environment variables
  jwt_secret            = var.jwt_secret
  jwt_refresh_secret    = var.jwt_refresh_secret

  tags = local.common_tags
}

# =============================================================================
# CloudFront Distribution
# =============================================================================

module "cloudfront" {
  source = "./modules/cloudfront"

  providers = {
    aws = aws.us_east_1
  }

  name_prefix              = local.name_prefix

  # S3 origins
  client_bucket_domain     = module.s3.client_bucket_domain_name
  client_bucket_arn        = module.s3.client_bucket_arn
  admin_bucket_domain      = module.s3.admin_bucket_domain_name
  admin_bucket_arn         = module.s3.admin_bucket_arn

  # ALB origin for API
  alb_domain_name          = module.alb.dns_name

  # Domain configuration
  client_domain_aliases    = var.client_domain_aliases
  admin_domain_aliases     = var.admin_domain_aliases
  certificate_arn          = var.cloudfront_certificate_arn

  tags = local.common_tags
}

# =============================================================================
# WAF (Web Application Firewall)
# =============================================================================

module "waf" {
  source = "./modules/waf"

  providers = {
    aws = aws.us_east_1
  }

  name_prefix           = local.name_prefix
  cloudfront_arn        = module.cloudfront.client_distribution_arn

  # Rate limiting
  rate_limit            = var.waf_rate_limit

  tags = local.common_tags
}

# =============================================================================
# Route 53 (Optional - if domain is managed in AWS)
# =============================================================================

module "route53" {
  source = "./modules/route53"
  count  = var.create_route53_records ? 1 : 0

  domain_name              = var.domain_name
  client_cloudfront_domain = module.cloudfront.client_distribution_domain
  admin_cloudfront_domain  = module.cloudfront.admin_distribution_domain
  api_alb_domain           = module.alb.dns_name
  api_alb_zone_id          = module.alb.zone_id

  tags = local.common_tags
}
