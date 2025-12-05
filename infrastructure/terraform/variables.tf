# =============================================================================
# Variables
# =============================================================================

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "blrplt"
}

variable "environment" {
  description = "Environment (production, staging, preview)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

# -----------------------------------------------------------------------------
# Domain Configuration
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Main domain name (e.g., example.com)"
  type        = string
}

variable "api_subdomain" {
  description = "Subdomain for API (e.g., api for api.example.com)"
  type        = string
  default     = "api"
}

variable "admin_subdomain" {
  description = "Subdomain for admin panel (e.g., admin for admin.example.com)"
  type        = string
  default     = "admin"
}

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------

variable "database_url" {
  description = "PostgreSQL connection URL (use existing RDS)"
  type        = string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Redis Configuration (Optional)
# -----------------------------------------------------------------------------

variable "enable_redis" {
  description = "Enable ElastiCache Redis"
  type        = bool
  default     = false
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

# -----------------------------------------------------------------------------
# App Runner Configuration
# -----------------------------------------------------------------------------

variable "server_cpu" {
  description = "CPU units for App Runner (256, 512, 1024, 2048, 4096)"
  type        = string
  default     = "256"
}

variable "server_memory" {
  description = "Memory for App Runner (512, 1024, 2048, 3072, 4096, etc.)"
  type        = string
  default     = "512"
}

variable "server_min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "server_max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 2
}

# -----------------------------------------------------------------------------
# Application Secrets
# -----------------------------------------------------------------------------

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret"
  type        = string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Optional: S3 for file uploads
# -----------------------------------------------------------------------------

variable "enable_s3_uploads" {
  description = "Enable S3 bucket for file uploads"
  type        = bool
  default     = true
}
