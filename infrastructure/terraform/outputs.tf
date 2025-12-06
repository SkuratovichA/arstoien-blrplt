# =============================================================================
# Outputs
# =============================================================================

output "api_url" {
  description = "API URL (e.g., https://api.blrplt.arstoien.org)"
  value       = "https://${local.api_domain}"
}

output "client_url" {
  description = "Client URL (e.g., https://blrplt.arstoien.org)"
  value       = "https://${local.client_domain}"
}

output "admin_url" {
  description = "Admin URL (e.g., https://admin.blrplt.arstoien.org)"
  value       = "https://${local.admin_domain}"
}

output "project_domain" {
  description = "Project domain (e.g., blrplt.arstoien.org)"
  value       = local.project_domain
}

output "ecr_repository_url" {
  description = "ECR repository URL for server"
  value       = aws_ecr_repository.server.repository_url
}

output "client_s3_bucket" {
  description = "S3 bucket for client static files"
  value       = aws_s3_bucket.client.id
}

output "admin_s3_bucket" {
  description = "S3 bucket for admin static files"
  value       = aws_s3_bucket.admin.id
}

output "uploads_s3_bucket" {
  description = "S3 bucket for file uploads"
  value       = var.enable_s3_uploads ? aws_s3_bucket.uploads[0].id : null
}

output "cloudfront_client_distribution_id" {
  description = "CloudFront distribution ID for client"
  value       = aws_cloudfront_distribution.client.id
}

output "cloudfront_admin_distribution_id" {
  description = "CloudFront distribution ID for admin"
  value       = aws_cloudfront_distribution.admin.id
}

output "apprunner_service_arn" {
  description = "App Runner service ARN"
  value       = aws_apprunner_service.server.arn
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = var.enable_redis ? aws_elasticache_cluster.redis[0].cache_nodes[0].address : null
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = var.create_rds ? aws_db_instance.postgres[0].endpoint : null
}

output "database_url" {
  description = "Database connection URL (sensitive)"
  value       = local.database_url
  sensitive   = true
}
