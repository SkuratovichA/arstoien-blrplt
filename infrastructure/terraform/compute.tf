# =============================================================================
# Compute Resources - ECR, App Runner
# =============================================================================

# -----------------------------------------------------------------------------
# ECR - Container Registry
# -----------------------------------------------------------------------------

resource "aws_ecr_repository" "server" {
  name                 = "${var.project_name}-server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "server" {
  repository = aws_ecr_repository.server.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# App Runner Service
# -----------------------------------------------------------------------------

resource "aws_apprunner_service" "server" {
  service_name = "${var.project_name}-server"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.server.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "3000"

        runtime_environment_variables = {
          NODE_ENV           = var.environment
          PORT               = "3000"
          DATABASE_URL       = local.database_url
          JWT_SECRET         = var.jwt_secret
          JWT_REFRESH_SECRET = var.jwt_refresh_secret
          REDIS_URL          = var.external_redis_url != "" ? var.external_redis_url : (var.enable_redis ? "redis://${aws_elasticache_cluster.redis[0].cache_nodes[0].address}:6379" : "")
          S3_BUCKET          = var.enable_s3_uploads ? aws_s3_bucket.uploads[0].id : ""
          S3_REGION          = var.aws_region
          AWS_REGION         = var.aws_region
          FRONTEND_URL       = "https://${local.client_domain}"
          ADMIN_FRONTEND_URL = "https://${local.admin_domain}"
          SMTP_HOST          = "email-smtp.${var.aws_region}.amazonaws.com"
          SMTP_PORT          = "587"
          SMTP_SECURE        = "false" # STARTTLS, not implicit TLS
          SMTP_USER          = aws_iam_access_key.ses_smtp.id
          SMTP_PASS          = aws_iam_access_key.ses_smtp.ses_smtp_password_v4
          EMAIL_FROM         = "noreply@${local.project_domain}"
        }
      }
    }

    auto_deployments_enabled = false
  }

  instance_configuration {
    cpu               = var.server_cpu
    memory            = var.server_memory
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  # VPC networking to access RDS
  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.server.arn
    }
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.server.arn

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  depends_on = [
    aws_iam_role_policy_attachment.apprunner_ecr_access,
    aws_apprunner_vpc_connector.server
  ]
}

# -----------------------------------------------------------------------------
# App Runner Auto Scaling
# -----------------------------------------------------------------------------

resource "aws_apprunner_auto_scaling_configuration_version" "server" {
  auto_scaling_configuration_name = "${var.project_name}-server"

  min_size = var.server_min_instances
  max_size = var.server_max_instances

  tags = {
    Name = "${var.project_name}-server-autoscaling"
  }
}

# -----------------------------------------------------------------------------
# App Runner VPC Connector
# -----------------------------------------------------------------------------

resource "aws_apprunner_vpc_connector" "server" {
  vpc_connector_name = "${var.project_name}-vpc-connector"
  subnets            = data.aws_subnets.default.ids
  security_groups    = [aws_security_group.apprunner[0].id]

  tags = {
    Name = "${var.project_name}-vpc-connector"
  }
}

# -----------------------------------------------------------------------------
# Custom Domain for App Runner
# -----------------------------------------------------------------------------

resource "aws_apprunner_custom_domain_association" "api" {
  domain_name          = local.api_domain
  service_arn          = aws_apprunner_service.server.arn
  enable_www_subdomain = false

  lifecycle {
    # Prevent recreation when validation records change
    ignore_changes = [enable_www_subdomain]
  }
}

# Certificate validation records for custom domain
resource "aws_route53_record" "apprunner_domain_validation" {
  for_each = {
    for record in aws_apprunner_custom_domain_association.api.certificate_validation_records :
    record.name => record
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.value]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}
