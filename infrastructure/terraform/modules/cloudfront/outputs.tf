# =============================================================================
# CloudFront Module Outputs
# =============================================================================

output "client_distribution_id" {
  description = "Client CloudFront distribution ID"
  value       = aws_cloudfront_distribution.client.id
}

output "client_distribution_arn" {
  description = "Client CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.client.arn
}

output "client_distribution_domain" {
  description = "Client CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.client.domain_name
}

output "admin_distribution_id" {
  description = "Admin CloudFront distribution ID"
  value       = aws_cloudfront_distribution.admin.id
}

output "admin_distribution_arn" {
  description = "Admin CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.admin.arn
}

output "admin_distribution_domain" {
  description = "Admin CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.admin.domain_name
}
