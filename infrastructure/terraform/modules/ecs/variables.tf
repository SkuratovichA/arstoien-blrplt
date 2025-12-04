# =============================================================================
# ECS Module Variables
# =============================================================================

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "server_ecr_url" {
  description = "Server ECR repository URL"
  type        = string
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "server_target_group_arn" {
  description = "ALB target group ARN for server"
  type        = string
}

variable "database_url" {
  description = "PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "redis_url" {
  description = "Redis connection string"
  type        = string
  sensitive   = true
}

variable "uploads_bucket" {
  description = "S3 bucket name for uploads"
  type        = string
}

variable "server_cpu" {
  description = "CPU units for server task"
  type        = number
  default     = 512
}

variable "server_memory" {
  description = "Memory for server task in MB"
  type        = number
  default     = 1024
}

variable "server_desired_count" {
  description = "Desired number of server tasks"
  type        = number
  default     = 2
}

variable "server_min_count" {
  description = "Minimum number of server tasks"
  type        = number
  default     = 1
}

variable "server_max_count" {
  description = "Maximum number of server tasks"
  type        = number
  default     = 10
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

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
