# =============================================================================
# Production Environment Variables
# =============================================================================

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = ""
}

variable "client_domain_aliases" {
  description = "Domain aliases for client"
  type        = list(string)
  default     = []
}

variable "admin_domain_aliases" {
  description = "Domain aliases for admin"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for ALB"
  type        = string
  default     = ""
}

variable "cloudfront_certificate_arn" {
  description = "ACM certificate ARN for CloudFront (must be in us-east-1)"
  type        = string
  default     = ""
}

variable "create_route53_records" {
  description = "Whether to create Route53 records"
  type        = bool
  default     = false
}
