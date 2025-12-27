# =============================================================================
# GitHub Actions OIDC Role
# =============================================================================
# This role allows GitHub Actions to deploy without storing AWS credentials
# =============================================================================

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_role" "github_actions_deploy" {
  name = "github-actions-deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:SkuratovichA/arstoien-blrplt:*"
          }
        }
      }
    ]
  })

  tags = {
    Description = "Role for GitHub Actions to deploy to AWS"
  }
}

# Attach necessary policies for deployment
resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "github-actions-deploy-policy"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "apprunner:ListServices",
          "apprunner:StartDeployment",
          "apprunner:DescribeService"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.client.arn,
          "${aws_s3_bucket.client.arn}/*",
          aws_s3_bucket.admin.arn,
          "${aws_s3_bucket.admin.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:ListDistributions"
        ]
        Resource = "*"
      }
    ]
  })
}

output "github_role_arn" {
  value       = aws_iam_role.github_actions_deploy.arn
  description = "ARN of the IAM role for GitHub Actions"
}