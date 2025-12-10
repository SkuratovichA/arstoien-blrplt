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
# URL structure: {prefix}.{project}.{root_domain}
# Example: api.blrplt.arstoien.org, admin.blrplt.arstoien.org
# -----------------------------------------------------------------------------

variable "root_domain" {
  description = "Root domain registered in Route 53 (e.g., arstoien.org)"
  type        = string
}

variable "project_subdomain" {
  description = "Project subdomain (e.g., blrplt for blrplt.arstoien.org)"
  type        = string
  default     = "blrplt"
}

variable "api_prefix" {
  description = "Prefix for API (e.g., api for api.blrplt.arstoien.org)"
  type        = string
  default     = "api"
}

variable "admin_prefix" {
  description = "Prefix for admin (e.g., admin for admin.blrplt.arstoien.org)"
  type        = string
  default     = "admin"
}

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------

variable "create_rds" {
  description = "Create a new RDS instance (if false, use existing database_url)"
  type        = bool
  default     = true
}

variable "database_url" {
  description = "PostgreSQL connection URL (only used if create_rds = false)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_instance_class" {
  description = "RDS instance class (db.t3.micro is free tier eligible)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS storage in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "blrplt"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "blrplt"
}

variable "db_password" {
  description = "Database master password (min 8 characters)"
  type        = string
  sensitive   = true
  default     = ""
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

# -----------------------------------------------------------------------------
# Email Configuration (SMTP)
# -----------------------------------------------------------------------------

variable "smtp_host" {
  description = "SMTP server hostname (e.g., email-smtp.eu-central-1.amazonaws.com for AWS SES)"
  type        = string
  default     = ""
}

variable "smtp_port" {
  description = "SMTP server port (587 for TLS, 465 for SSL)"
  type        = number
  default     = 587
}

variable "smtp_secure" {
  description = "Use TLS for SMTP connection"
  type        = bool
  default     = true
}

variable "smtp_user" {
  description = "SMTP username"
  type        = string
  sensitive   = true
  default     = ""
}

variable "smtp_pass" {
  description = "SMTP password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "email_from" {
  description = "Default sender email address (e.g., noreply@blrplt.arstoien.com)"
  type        = string
  default     = ""
}
