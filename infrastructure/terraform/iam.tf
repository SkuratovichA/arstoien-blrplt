# =============================================================================
# IAM - Roles and Policies
# =============================================================================

# -----------------------------------------------------------------------------
# App Runner ECR Access Role
# -----------------------------------------------------------------------------

resource "aws_iam_role" "apprunner_ecr_access" {
  name = "${var.project_name}-apprunner-ecr-access"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr_access" {
  role       = aws_iam_role.apprunner_ecr_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# -----------------------------------------------------------------------------
# App Runner Instance Role
# -----------------------------------------------------------------------------

resource "aws_iam_role" "apprunner_instance" {
  name = "${var.project_name}-apprunner-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

# S3 access for file uploads (if enabled)
resource "aws_iam_role_policy" "apprunner_s3_access" {
  count = var.enable_s3_uploads ? 1 : 0

  name = "${var.project_name}-apprunner-s3-access"
  role = aws_iam_role.apprunner_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.uploads[0].arn,
          "${aws_s3_bucket.uploads[0].arn}/*"
        ]
      }
    ]
  })
}

# SES API access removed - using SMTP via VPC endpoint instead

# -----------------------------------------------------------------------------
# SES SMTP User (for email sending)
# -----------------------------------------------------------------------------

resource "aws_iam_user" "ses_smtp" {
  name = "${var.project_name}-ses-smtp"
}

resource "aws_iam_user_policy" "ses_smtp" {
  name = "${var.project_name}-ses-send"
  user = aws_iam_user.ses_smtp.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ses:FromAddress" = var.email_from
          }
        }
      }
    ]
  })
}

# Generate SMTP credentials
resource "aws_iam_access_key" "ses_smtp" {
  user = aws_iam_user.ses_smtp.name
}
