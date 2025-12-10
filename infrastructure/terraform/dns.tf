# =============================================================================
# Route 53 - DNS
# =============================================================================

data "aws_route53_zone" "main" {
  name         = var.root_domain
  private_zone = false
}

# DNS record for API (App Runner)
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.api_domain
  type    = "CNAME"
  ttl     = 300
  records = [aws_apprunner_service.server.service_url]
}

# DNS Records for CloudFront (Client)
resource "aws_route53_record" "client" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.client_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.client.domain_name
    zone_id                = aws_cloudfront_distribution.client.hosted_zone_id
    evaluate_target_health = false
  }
}

# DNS Records for CloudFront (Admin)
resource "aws_route53_record" "admin" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.admin_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.admin.domain_name
    zone_id                = aws_cloudfront_distribution.admin.hosted_zone_id
    evaluate_target_health = false
  }
}
