# =============================================================================
# Production Environment Outputs
# =============================================================================

output "api_endpoint" {
  description = "API endpoint URL"
  value       = module.infrastructure.api_endpoint
}

output "graphql_endpoint" {
  description = "GraphQL endpoint URL"
  value       = module.infrastructure.graphql_endpoint
}

output "client_url" {
  description = "Client application URL"
  value       = "https://${module.infrastructure.client_cloudfront_domain}"
}

output "admin_url" {
  description = "Admin application URL"
  value       = "https://${module.infrastructure.admin_cloudfront_domain}"
}

output "server_ecr_repository" {
  description = "Server ECR repository URL"
  value       = module.infrastructure.server_ecr_repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.infrastructure.ecs_cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.infrastructure.ecs_service_name
}
