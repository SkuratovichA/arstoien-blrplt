# =============================================================================
# CloudFront Module Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "client_bucket_domain" {
  description = "Client S3 bucket domain name"
  type        = string
}

variable "client_bucket_arn" {
  description = "Client S3 bucket ARN"
  type        = string
}

variable "admin_bucket_domain" {
  description = "Admin S3 bucket domain name"
  type        = string
}

variable "admin_bucket_arn" {
  description = "Admin S3 bucket ARN"
  type        = string
}

variable "alb_domain_name" {
  description = "ALB domain name for API origin"
  type        = string
}

variable "client_domain_aliases" {
  description = "Domain aliases for client distribution"
  type        = list(string)
  default     = []
}

variable "admin_domain_aliases" {
  description = "Domain aliases for admin distribution"
  type        = list(string)
  default     = []
}

variable "certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
