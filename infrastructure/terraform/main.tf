# =============================================================================
# AWS App Runner Infrastructure
# =============================================================================
# Simple, cost-effective infrastructure:
# - App Runner for NestJS server (auto-scaling, built-in HTTPS)
# - S3 + CloudFront for static files (client/admin)
# - Route 53 for DNS
# - ACM for SSL certificates
# - Optional: ElastiCache Redis
# - Optional: AWS SES for email
# =============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment to use S3 backend for state storage
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "blrplt/terraform.tfstate"
  #   region = "eu-central-1"
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

# Provider for CloudFront certificates (must be us-east-1)
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
  # Domain structure: {prefix}.{project}.{root_domain}
  # Example: api.blrplt.arstoien.com
  project_domain = "${var.project_subdomain}.${var.root_domain}"
  api_domain     = "${var.api_prefix}.${local.project_domain}"
  admin_domain   = "${var.admin_prefix}.${local.project_domain}"
  client_domain  = local.project_domain
}
