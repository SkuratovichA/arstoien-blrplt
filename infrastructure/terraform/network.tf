# =============================================================================
# Network - VPC Endpoints
# =============================================================================

# -----------------------------------------------------------------------------
# VPC Endpoint for SES SMTP
# Allows App Runner to reach SES without NAT Gateway
# -----------------------------------------------------------------------------

resource "aws_vpc_endpoint" "ses_smtp" {
  vpc_id            = data.aws_vpc.default.id
  service_name      = "com.amazonaws.${var.aws_region}.email-smtp"
  vpc_endpoint_type = "Interface"

  subnet_ids         = data.aws_subnets.default.ids
  security_group_ids = [aws_security_group.apprunner[0].id]

  # Enable private DNS so the endpoint hostname resolves automatically
  private_dns_enabled = true

  tags = {
    Name        = "${var.project_name}-ses-smtp-endpoint"
    Environment = var.environment
    Purpose     = "SES SMTP access for App Runner"
  }
}