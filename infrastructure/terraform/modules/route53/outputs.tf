# =============================================================================
# Route 53 Module Outputs
# =============================================================================

output "zone_id" {
  description = "Route 53 hosted zone ID"
  value       = data.aws_route53_zone.main.zone_id
}

output "client_fqdn" {
  description = "Client fully qualified domain name"
  value       = aws_route53_record.client.fqdn
}

output "admin_fqdn" {
  description = "Admin fully qualified domain name"
  value       = aws_route53_record.admin.fqdn
}

output "api_fqdn" {
  description = "API fully qualified domain name"
  value       = aws_route53_record.api.fqdn
}
