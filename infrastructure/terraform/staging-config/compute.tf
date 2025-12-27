# =============================================================================
# SIMPLE EC2 COMPUTE - Replaces Expensive App Runner
# Cost: ~$11/month (EC2 + Elastic IP) vs $65.70/month for App Runner
# =============================================================================

# -----------------------------------------------------------------------------
# Security Group for EC2
# -----------------------------------------------------------------------------
resource "aws_security_group" "ec2_server" {
  name        = "${var.project_name}-ec2-server"
  description = "Security group for EC2 server"
  vpc_id      = data.aws_vpc.default.id

  # SSH access (restrict to your IP in production)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # TODO: Restrict to your IP
    description = "SSH access"
  }

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # App port (3000)
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Node.js app"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "${var.project_name}-ec2-server"
  }
}

# -----------------------------------------------------------------------------
# EC2 Instance - Simple and Cheap
# -----------------------------------------------------------------------------
resource "aws_instance" "server" {
  # Amazon Linux 2023 (free tier eligible)
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.ec2_instance_type  # t3.micro = $7.59/month

  # Use default VPC - no custom VPC needed
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.ec2_server.id]

  # Storage
  root_block_device {
    volume_type = "gp3"
    volume_size = 30  # GB (minimum required for Amazon Linux 2023)
    encrypted   = true
  }

  # IAM role for S3 access (if needed)
  iam_instance_profile = aws_iam_instance_profile.ec2_server.name

  # SSH key for access
  key_name = aws_key_pair.server.key_name

  # User data script to set up the server
  user_data = templatefile("${path.module}/scripts/ec2-setup.sh", {
    project_name       = var.project_name
    node_env          = var.environment
    database_url      = local.database_url
    redis_url         = var.external_redis_url
    jwt_secret        = var.jwt_secret
    jwt_refresh_secret = var.jwt_refresh_secret
    s3_bucket         = var.enable_s3_uploads ? aws_s3_bucket.uploads[0].id : ""
    aws_region        = var.aws_region
    frontend_url      = "https://${local.client_domain}"
    admin_url         = "https://${local.admin_domain}"
    api_url           = "https://${local.api_domain}"
    smtp_host         = "email-smtp.${var.aws_region}.amazonaws.com"
    smtp_port         = "587"
    smtp_user         = var.smtp_user
    smtp_pass         = var.smtp_pass
    email_from        = "noreply@${local.project_domain}"
    ecr_registry      = ""  # Not used for EC2 deployment, but needed for template
    PORT              = "PORT"  # Used in Node.js template literal, preserve as-is
  })

  tags = {
    Name = "${var.project_name}-server"
  }
}

# -----------------------------------------------------------------------------
# Elastic IP - Static IP address ($3.65/month)
# -----------------------------------------------------------------------------
resource "aws_eip" "server" {
  instance = aws_instance.server.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-server-ip"
  }
}

# -----------------------------------------------------------------------------
# IAM Role for EC2
# -----------------------------------------------------------------------------
resource "aws_iam_role" "ec2_server" {
  name = "${var.project_name}-ec2-server"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_server" {
  name = "${var.project_name}-ec2-server"
  role = aws_iam_role.ec2_server.name
}

# S3 access policy (if uploads enabled)
resource "aws_iam_role_policy" "ec2_s3_access" {
  count = var.enable_s3_uploads ? 1 : 0
  name  = "${var.project_name}-ec2-s3-access"
  role  = aws_iam_role.ec2_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
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

# ECR access policy (to pull Docker images)
resource "aws_iam_role_policy" "ec2_ecr_access" {
  name = "${var.project_name}-ec2-ecr-access"
  role = aws_iam_role.ec2_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Logs access
resource "aws_iam_role_policy" "ec2_cloudwatch" {
  name = "${var.project_name}-ec2-cloudwatch"
  role = aws_iam_role.ec2_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# SSH Key Pair
# -----------------------------------------------------------------------------
resource "tls_private_key" "server" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "server" {
  key_name   = "${var.project_name}-server-key"
  public_key = tls_private_key.server.public_key_openssh

  tags = {
    Name = "${var.project_name}-server-key"
  }
}

# Save private key locally (for SSH access)
resource "local_file" "private_key" {
  content         = tls_private_key.server.private_key_pem
  filename        = "${path.module}/keys/${var.project_name}-server.pem"
  file_permission = "0600"
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-kernel-6.1-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# -----------------------------------------------------------------------------
# Route53 DNS Record - Point API to EC2 directly
# -----------------------------------------------------------------------------
resource "aws_route53_record" "api_ec2" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.api_domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.server.public_ip]
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------
output "ec2_public_ip" {
  value       = aws_eip.server.public_ip
  description = "Public IP of EC2 server"
}

output "ec2_instance_id" {
  value       = aws_instance.server.id
  description = "EC2 instance ID"
}

output "ssh_command" {
  value       = "ssh -i ${path.module}/keys/${var.project_name}-server.pem ec2-user@${aws_eip.server.public_ip}"
  description = "SSH command to connect to server"
}

output "api_direct_url" {
  value       = "http://${aws_eip.server.public_ip}:3000"
  description = "Direct API URL (before DNS propagation)"
}