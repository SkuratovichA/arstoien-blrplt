# =============================================================================
# S3 Module Outputs
# =============================================================================

# Uploads bucket
output "uploads_bucket_name" {
  description = "Uploads S3 bucket name"
  value       = aws_s3_bucket.uploads.id
}

output "uploads_bucket_arn" {
  description = "Uploads S3 bucket ARN"
  value       = aws_s3_bucket.uploads.arn
}

output "uploads_bucket_domain_name" {
  description = "Uploads S3 bucket domain name"
  value       = aws_s3_bucket.uploads.bucket_regional_domain_name
}

# Client bucket
output "client_bucket_name" {
  description = "Client S3 bucket name"
  value       = aws_s3_bucket.client.id
}

output "client_bucket_arn" {
  description = "Client S3 bucket ARN"
  value       = aws_s3_bucket.client.arn
}

output "client_bucket_domain_name" {
  description = "Client S3 bucket domain name"
  value       = aws_s3_bucket.client.bucket_regional_domain_name
}

# Admin bucket
output "admin_bucket_name" {
  description = "Admin S3 bucket name"
  value       = aws_s3_bucket.admin.id
}

output "admin_bucket_arn" {
  description = "Admin S3 bucket ARN"
  value       = aws_s3_bucket.admin.arn
}

output "admin_bucket_domain_name" {
  description = "Admin S3 bucket domain name"
  value       = aws_s3_bucket.admin.bucket_regional_domain_name
}
