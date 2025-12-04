# =============================================================================
# Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# VPC Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# -----------------------------------------------------------------------------
# ECR Outputs
# -----------------------------------------------------------------------------

output "server_ecr_repository_url" {
  description = "Server ECR repository URL"
  value       = module.ecr.server_repository_url
}

output "client_ecr_repository_url" {
  description = "Client ECR repository URL"
  value       = module.ecr.client_repository_url
}

output "admin_ecr_repository_url" {
  description = "Admin ECR repository URL"
  value       = module.ecr.admin_repository_url
}

# -----------------------------------------------------------------------------
# Database Outputs
# -----------------------------------------------------------------------------

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.endpoint
  sensitive   = true
}

# -----------------------------------------------------------------------------
# S3 Outputs
# -----------------------------------------------------------------------------

output "uploads_bucket_name" {
  description = "S3 bucket for file uploads"
  value       = module.s3.uploads_bucket_name
}

output "client_bucket_name" {
  description = "S3 bucket for client static files"
  value       = module.s3.client_bucket_name
}

output "admin_bucket_name" {
  description = "S3 bucket for admin static files"
  value       = module.s3.admin_bucket_name
}

# -----------------------------------------------------------------------------
# ALB Outputs
# -----------------------------------------------------------------------------

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.dns_name
}

output "alb_zone_id" {
  description = "ALB Zone ID"
  value       = module.alb.zone_id
}

# -----------------------------------------------------------------------------
# CloudFront Outputs
# -----------------------------------------------------------------------------

output "client_cloudfront_domain" {
  description = "CloudFront domain for client"
  value       = module.cloudfront.client_distribution_domain
}

output "admin_cloudfront_domain" {
  description = "CloudFront domain for admin"
  value       = module.cloudfront.admin_distribution_domain
}

output "client_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for client"
  value       = module.cloudfront.client_distribution_id
}

output "admin_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for admin"
  value       = module.cloudfront.admin_distribution_id
}

# -----------------------------------------------------------------------------
# ECS Outputs
# -----------------------------------------------------------------------------

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

output "api_endpoint" {
  description = "API endpoint URL"
  value       = "https://${module.alb.dns_name}"
}

output "graphql_endpoint" {
  description = "GraphQL endpoint URL"
  value       = "https://${module.alb.dns_name}/graphql"
}
