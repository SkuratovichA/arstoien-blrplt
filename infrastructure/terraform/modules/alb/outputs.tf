# =============================================================================
# ALB Module Outputs
# =============================================================================

output "dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "zone_id" {
  description = "ALB Zone ID"
  value       = aws_lb.main.zone_id
}

output "arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "server_target_group_arn" {
  description = "Server target group ARN"
  value       = aws_lb_target_group.server.arn
}

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "HTTPS listener ARN"
  value       = length(aws_lb_listener.https) > 0 ? aws_lb_listener.https[0].arn : null
}
