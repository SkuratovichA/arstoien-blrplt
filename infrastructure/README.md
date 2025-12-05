# AWS Infrastructure

Simple, cost-effective AWS infrastructure using App Runner.

## Architecture

```
                    ┌─────────────────┐
                    │   Route 53      │
                    │   (DNS)         │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   CloudFront    │ │   CloudFront    │ │   App Runner    │
│   (client)      │ │   (admin)       │ │   (server)      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   │
┌─────────────────┐ ┌─────────────────┐          │
│   S3 Bucket     │ │   S3 Bucket     │          │
│   (client)      │ │   (admin)       │          │
└─────────────────┘ └─────────────────┘          │
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
           ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
           │   RDS           │          │   ElastiCache   │          │   S3 Bucket     │
           │   (PostgreSQL)  │          │   (Redis)       │          │   (uploads)     │
           └─────────────────┘          └─────────────────┘          └─────────────────┘
```

## Estimated Monthly Cost

| Service | Configuration | Cost |
|---------|--------------|------|
| App Runner | 0.25 vCPU, 512MB, 1 instance | ~$15-25 |
| CloudFront | 2 distributions | ~$1-5 |
| S3 | 3 buckets | ~$1-3 |
| Route 53 | 1 hosted zone | ~$0.50 |
| ACM | SSL certificates | Free |
| RDS (existing) | Your existing instance | ~$3 |
| ElastiCache (optional) | t3.micro | ~$12 |

**Total: ~$20-50/month** (without Redis: ~$20-35/month)

## Setup

### Prerequisites

1. AWS CLI configured
2. Terraform installed (>= 1.0)
3. Domain registered in Route 53

### Deploy Infrastructure

```bash
cd infrastructure/terraform

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
```

### GitHub Actions Secrets

After deploying infrastructure, add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for GitHub Actions (OIDC) |
| `NPM_TOKEN` | npm token for private packages |
| `ECR_REPOSITORY` | ECR repository name |
| `APPRUNNER_SERVICE_ARN` | App Runner service ARN |
| `CLIENT_S3_BUCKET` | S3 bucket name for client |
| `ADMIN_S3_BUCKET` | S3 bucket name for admin |
| `CLIENT_CLOUDFRONT_ID` | CloudFront distribution ID for client |
| `ADMIN_CLOUDFRONT_ID` | CloudFront distribution ID for admin |
| `VITE_API_URL` | API URL (e.g., https://api.example.com) |
| `VITE_WS_URL` | WebSocket URL (e.g., wss://api.example.com) |
| `VITE_APP_NAME` | App name |
| `VITE_GRAPHQL_URL` | GraphQL URL for admin |

### Preview Environments

For preview deployments, also add:

| Secret | Description |
|--------|-------------|
| `PREVIEW_S3_BUCKET` | S3 bucket for preview deployments |
| `PREVIEW_API_URL` | Preview API URL |
| `PREVIEW_WS_URL` | Preview WebSocket URL |
| `PREVIEW_GRAPHQL_URL` | Preview GraphQL URL |

## HTTPS

HTTPS is handled automatically:
- **App Runner**: Built-in HTTPS with custom domain
- **CloudFront**: SSL certificate from ACM (free)

Both use ACM certificates that are automatically renewed.

## Deployment

### Production
Push to `main` branch triggers automatic deployment.

### Preview
Add the `deploy` label to a PR to create a preview environment.
Remove the label or close the PR to clean up.

## Scaling

App Runner auto-scales based on traffic:
- Min instances: 1 (configurable)
- Max instances: 2 (configurable)
- Scale based on concurrent requests

To adjust, modify `server_min_instances` and `server_max_instances` in `terraform.tfvars`.
