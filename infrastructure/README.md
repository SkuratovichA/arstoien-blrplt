# AWS Infrastructure

Simple, cost-effective AWS infrastructure using App Runner.

## URL Structure

```
Production:
├── blrplt.arstoien.org          → Client app
├── admin.blrplt.arstoien.org    → Admin panel
└── api.blrplt.arstoien.org      → API server

PR Previews (with "deploy" label):
├── Client: S3 static hosting with path /pr-{number}/
└── API: Shares production (or use separate preview environment)
```

## Architecture

```
                    ┌─────────────────┐
                    │   Route 53      │
                    │  arstoien.org   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   CloudFront    │ │   CloudFront    │ │   App Runner    │
│ blrplt.arstoien │ │admin.blrplt...  │ │ api.blrplt...   │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   │
┌─────────────────┐ ┌─────────────────┐          │
│   S3 Bucket     │ │   S3 Bucket     │          │
└─────────────────┘ └─────────────────┘          │
                                                 │
                    ┌────────────────────────────┤
                    │                            │
                    ▼                            ▼
           ┌─────────────────┐          ┌─────────────────┐
           │   RDS           │          │   S3 Bucket     │
           │   (existing)    │          │   (uploads)     │
           └─────────────────┘          └─────────────────┘
```

## Estimated Monthly Cost

| Service | Configuration | Cost |
|---------|--------------|------|
| App Runner | 0.25 vCPU, 512MB, 1 instance | ~$15-25 |
| CloudFront | 2 distributions | ~$1-5 |
| S3 | 3 buckets | ~$1-3 |
| Route 53 | 1 hosted zone | ~$0.50 |
| ACM | SSL certificates | Free |
| RDS (existing) | Your instance | ~$3 |

**Total: ~$20-35/month**

---

## What You Need to Configure

### Step 1: AWS Prerequisites

#### 1.1 Route 53 Hosted Zone
Your root domain must exist in Route 53:

```
Route 53 → Hosted zones → arstoien.org
```

If domain is registered elsewhere, update nameservers to AWS.

#### 1.2 IAM Role for GitHub Actions (OIDC)

Create OIDC provider (one-time):
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

Create IAM role `github-actions-blrplt` with trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/arstoien-blrplt:*"
        }
      }
    }
  ]
}
```

Attach policies:
- `AmazonEC2ContainerRegistryPowerUser`
- `AWSAppRunnerFullAccess`
- Custom S3/CloudFront policy

### Step 2: Terraform Configuration

Create `terraform.tfvars`:

```hcl
# Project
project_name = "blrplt"
environment  = "production"
aws_region   = "eu-central-1"

# Domain - creates: api.blrplt.arstoien.org, admin.blrplt.arstoien.org, blrplt.arstoien.org
root_domain       = "arstoien.org"
project_subdomain = "blrplt"
api_prefix        = "api"
admin_prefix      = "admin"

# Your existing RDS
database_url = "postgresql://user:pass@your-rds.eu-central-1.rds.amazonaws.com:5432/blrplt"

# Secrets (generate with: openssl rand -base64 32)
jwt_secret         = "your-jwt-secret-at-least-32-characters-long"
jwt_refresh_secret = "your-refresh-secret-at-least-32-characters"

# Optional
enable_redis      = false
enable_s3_uploads = true

# App Runner sizing
server_cpu           = "256"
server_memory        = "512"
server_min_instances = 1
server_max_instances = 2
```

### Step 3: Deploy Infrastructure

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

### Step 4: GitHub Secrets

After `terraform apply`, add these secrets to your repo:

| Secret | Value (from terraform output) |
|--------|-------------------------------|
| `AWS_ROLE_ARN` | Your IAM role ARN |
| `NPM_TOKEN` | Your npm token |
| `ECR_REPOSITORY` | `blrplt-server` |
| `APPRUNNER_SERVICE_ARN` | From terraform output |
| `CLIENT_S3_BUCKET` | From terraform output |
| `ADMIN_S3_BUCKET` | From terraform output |
| `CLIENT_CLOUDFRONT_ID` | From terraform output |
| `ADMIN_CLOUDFRONT_ID` | From terraform output |
| `VITE_API_URL` | `https://api.blrplt.arstoien.org/graphql` (use `graphql_url` output) |
| `VITE_WS_URL` | `wss://api.blrplt.arstoien.org/graphql` |
| `VITE_APP_NAME` | `Blrplt` |
| `VITE_GRAPHQL_URL` | `https://api.blrplt.arstoien.org/graphql` (use `graphql_url` output) |

---

## HTTPS

Fully automatic:
- **API**: App Runner provides HTTPS automatically
- **Static sites**: CloudFront + ACM certificate (free, auto-renewed)

Terraform creates and validates certificates via DNS.

---

## Deployment

### Production
```
Push to main → CI passes → Auto-deploy
```

### PR Preview
```
Add "deploy" label → Static files deployed → Comment with URLs
Remove label / Close PR → Cleanup
```

---

## PR Preview with Unique URLs

For unique subdomain previews like `pr-123-api.blrplt.arstoien.org`, you need:

1. **Wildcard certificate** for `*.blrplt.arstoien.org`
2. **Dynamic Route 53 records** per PR
3. **Per-PR App Runner services** (adds ~$15-25/PR)

This is expensive for many PRs. Current setup uses:
- Shared S3 bucket with paths (`/client-pr-123/`, `/admin-pr-123/`)
- Shared production API (or manual preview API setup)

To enable full subdomain isolation, uncomment the wildcard certificate in `main.tf` and update the preview workflow.

---

## Scaling

```hcl
# terraform.tfvars
server_min_instances = 1    # Min (saves cost when idle)
server_max_instances = 5    # Max (handles traffic spikes)
server_cpu           = "512"  # Increase for compute-heavy
server_memory        = "1024" # Increase for memory-heavy
```
