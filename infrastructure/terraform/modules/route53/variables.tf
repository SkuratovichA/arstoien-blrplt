# =============================================================================
# Route 53 Module Variables
# =============================================================================

variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

variable "client_cloudfront_domain" {
  description = "Client CloudFront distribution domain"
  type        = string
}

variable "admin_cloudfront_domain" {
  description = "Admin CloudFront distribution domain"
  type        = string
}

variable "api_alb_domain" {
  description = "API ALB domain name"
  type        = string
}

variable "api_alb_zone_id" {
  description = "API ALB zone ID"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
