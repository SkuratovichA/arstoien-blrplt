# =============================================================================
# Preview Environment Outputs
# =============================================================================

output "client_url" {
  description = "Client preview URL"
  value       = "http://${aws_s3_bucket_website_configuration.client.website_endpoint}"
}

output "admin_url" {
  description = "Admin preview URL"
  value       = "http://${aws_s3_bucket_website_configuration.admin.website_endpoint}"
}

output "client_bucket" {
  description = "Client S3 bucket name"
  value       = aws_s3_bucket.client.id
}

output "admin_bucket" {
  description = "Admin S3 bucket name"
  value       = aws_s3_bucket.admin.id
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.server.name
}

output "security_group_id" {
  description = "Server security group ID"
  value       = aws_security_group.preview_server.id
}
