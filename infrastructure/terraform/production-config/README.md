# Production Infrastructure Configuration (App Runner-based)

This configuration provides a fully managed, auto-scaling infrastructure using AWS App Runner. While more expensive (~$102/month), it offers better scalability and less maintenance overhead.

## Cost Breakdown

- **App Runner**: $65.70/month (includes compute and auto-scaling)
- **VPC Connector**: $36.50/month (for private RDS access)
- **Total**: ~$102/month

## Features

- ✅ Fully managed container service (App Runner)
- ✅ Automatic scaling (1-10 instances)
- ✅ Zero-downtime deployments
- ✅ Built-in load balancing
- ✅ Automatic SSL/TLS
- ✅ VPC integration for secure database access
- ✅ ECR for container registry
- ✅ RDS PostgreSQL database
- ✅ ElastiCache Redis (optional)
- ✅ S3 for file uploads
- ✅ CloudFront CDN for frontend apps
- ✅ SES for email delivery

## Prerequisites

- AWS CLI configured
- Terraform >= 1.0
- Docker installed locally
- Domain registered in Route53
- GitHub repository for CI/CD

## Quick Start

### 1. Configure Variables

Copy the example variables file and configure your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your configuration:

```hcl
# Domain configuration
root_domain = "yourdomain.com"
project_subdomain = "yourproject"

# Database
create_rds = true
db_password = "secure-password-here"
db_instance_class = "db.t3.micro"  # or larger for production

# Redis (optional)
enable_redis = false  # Set to true for ElastiCache
external_redis_url = ""  # Or use external Redis

# JWT Secrets
jwt_secret = "your-jwt-secret"
jwt_refresh_secret = "your-jwt-refresh-secret"

# SMTP (AWS SES)
smtp_user = "your-ses-smtp-user"
smtp_pass = "your-ses-smtp-password"

# App Runner Configuration
server_cpu = "512"     # 256, 512, 1024, 2048, 4096
server_memory = "1024" # 512, 1024, 2048, 3072, 4096, etc.
server_min_instances = 1
server_max_instances = 10

# Disable EC2 deployment
enable_ec2_deployment = false
```

### 2. Initialize and Deploy

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Deploy infrastructure
terraform apply
```

### 3. Save Important Outputs

After deployment, save these outputs:

```bash
# Get App Runner service URL
terraform output apprunner_service_url

# Get ECR repository URL
terraform output ecr_repository_url

# Get database URL (sensitive)
terraform output -raw database_url

# Get CloudFront distributions
terraform output cloudfront_client_url
terraform output cloudfront_admin_url
```

## GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository:

```yaml
# AWS Authentication
AWS_ROLE_ARN: arn:aws:iam::YOUR_ACCOUNT:role/github-actions-role

# App Runner
APPRUNNER_SERVICE_ARN: (from terraform output)
ECR_REPOSITORY: (from terraform output)

# Database
DATABASE_URL: (from terraform output -raw database_url)

# Redis
REDIS_URL: redis://your-redis-url:port

# Application Secrets
JWT_SECRET: your-jwt-secret
JWT_REFRESH_SECRET: your-jwt-refresh-secret

# S3
S3_BUCKET: blrplt-uploads-production

# Email (SES)
SMTP_USER: your-smtp-user
SMTP_PASS: your-smtp-pass
EMAIL_FROM: noreply@yourproject.yourdomain.com

# Frontend URLs
FRONTEND_URL: https://yourproject.yourdomain.com
ADMIN_FRONTEND_URL: https://admin.yourproject.yourdomain.com

# CloudFront
CLIENT_CLOUDFRONT_ID: (from terraform output)
ADMIN_CLOUDFRONT_ID: (from terraform output)
```

### Deployment Workflow

The deployment workflow automatically:
1. Builds Docker image
2. Pushes to ECR
3. Updates App Runner service
4. Waits for healthy deployment

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: eu-central-1

      - name: Build and Push to ECR
        run: |
          # Build and push Docker image
          docker build -t ${{ secrets.ECR_REPOSITORY }}:latest .
          docker push ${{ secrets.ECR_REPOSITORY }}:latest

      - name: Update App Runner Service
        run: |
          aws apprunner start-deployment \
            --service-arn ${{ secrets.APPRUNNER_SERVICE_ARN }}
```

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│    S3 Buckets   │
│      (CDN)      │     │  (Static Files) │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   Route53 DNS   │────▶│   App Runner    │
└─────────────────┘     │    (Auto-scale) │
                        └─────────────────┘
                                 │
                        ┌────────┴────────┐
                        ▼                 ▼
                ┌─────────────┐   ┌─────────────┐
                │  RDS (VPC)  │   │Redis (VPC)  │
                └─────────────┘   └─────────────┘
```

## Monitoring & Maintenance

### App Runner Dashboard

Monitor your service at:
```
https://console.aws.amazon.com/apprunner
```

Key metrics:
- Request count
- Response time
- CPU utilization
- Memory utilization
- Active instances

### CloudWatch Logs

View application logs:
```bash
aws logs tail /aws/apprunner/YOUR_SERVICE_NAME --follow
```

### Database Monitoring

```bash
# Check RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=blrplt-db \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

## Scaling Configuration

### Automatic Scaling

App Runner automatically scales based on:
- Request rate
- CPU utilization
- Memory utilization

Configure in `terraform.tfvars`:
```hcl
server_min_instances = 1   # Minimum instances
server_max_instances = 10  # Maximum instances
```

### Manual Scaling

Temporarily increase capacity:
```bash
aws apprunner update-service \
  --service-arn YOUR_SERVICE_ARN \
  --auto-scaling-configuration-arn \
    "arn:aws:apprunner:REGION:ACCOUNT:autoscalingconfiguration/custom/VERSION"
```

## High Availability Features

1. **Multi-AZ Deployment**: App Runner automatically distributes across AZs
2. **Database Backup**: RDS automated backups enabled
3. **Auto-recovery**: Automatic instance replacement on failure
4. **Load Balancing**: Built-in application load balancing
5. **Health Checks**: Automatic health monitoring and recovery

## Security Features

1. **VPC Integration**: Private database access via VPC Connector
2. **IAM Roles**: Least-privilege access policies
3. **Secrets Management**: Sensitive data in environment variables
4. **SSL/TLS**: Automatic HTTPS with managed certificates
5. **Security Groups**: Network-level access control

## Backup & Disaster Recovery

### Database Backups

RDS automated backups are enabled by default:
- 7-day retention period
- Point-in-time recovery available

Manual backup:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier blrplt-db \
  --db-snapshot-identifier blrplt-manual-$(date +%Y%m%d)
```

### Application State

App Runner maintains:
- Container images in ECR
- Configuration in service definition
- Automatic rollback on failed deployments

## Cost Optimization

### When to Use This Config

Best for:
- Production workloads with variable traffic
- Applications requiring high availability
- Teams wanting minimal operational overhead
- Auto-scaling requirements

### Cost Reduction Options

1. **Reserved Capacity**: Not available for App Runner
2. **Optimize Instance Size**: Adjust CPU/Memory in variables
3. **Database**: Use Aurora Serverless for variable workloads
4. **Remove VPC Connector**: Use publicly accessible RDS (less secure)
5. **Alternative**: Switch to staging-config for 91% cost savings

## Migration to Cheap Config

If costs become a concern, migrate to EC2:

```bash
cd ../staging-config
terraform init
terraform import aws_instance.server INSTANCE_ID
terraform apply
```

Benefits of migrating:
- 91% cost reduction (~$91/month savings)
- Full control over infrastructure
- Same features with manual scaling

Trade-offs:
- Manual scaling required
- More operational overhead
- Self-managed updates and patches

## Troubleshooting

### Deployment Failures

1. Check App Runner logs:
   ```bash
   aws logs tail /aws/apprunner/YOUR_SERVICE --follow
   ```

2. Verify ECR image:
   ```bash
   aws ecr describe-images --repository-name blrplt-server
   ```

3. Check service status:
   ```bash
   aws apprunner describe-service --service-arn YOUR_ARN
   ```

### Connection Issues

1. Verify VPC Connector status
2. Check security groups allow traffic
3. Ensure RDS is in correct subnets
4. Verify DNS propagation

### Performance Issues

1. Check auto-scaling metrics
2. Increase minimum instances
3. Upgrade CPU/Memory allocation
4. Enable Redis for caching

## Support

For issues:
1. Check App Runner console for service health
2. Review CloudWatch logs for errors
3. Verify all GitHub secrets are set correctly
4. Check VPC Connector and RDS connectivity

## Related Documentation

- [Cheap Config (EC2)](../staging-config/README.md)
- [Main Infrastructure Documentation](../README.md)
- [App Runner Best Practices](https://docs.aws.amazon.com/apprunner/latest/dg/best-practices.html)
- [Cost Comparison](../../../docs/COST_COMPARISON.md)