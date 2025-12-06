# Deployment Summary

## Infrastructure Setup Complete! 🚀

### What's Being Deployed (Running Now)
- **37 AWS resources** being created via Terraform
- **App Runner** service for NestJS backend (1 vCPU, 2GB RAM)
- **RDS PostgreSQL** database (db.t3.micro)
- **3 S3 Buckets** for client, admin, and uploads
- **2 CloudFront CDNs** for frontend apps
- **ECR Repository** for Docker images
- **GitHub OIDC Role** for secure deployments (no stored secrets!)

### Domains Being Configured
- `api.blrplt.arstoien.com` - Backend API
- `blrplt.arstoien.com` - Client frontend
- `admin.blrplt.arstoien.com` - Admin panel

### Deployment Methods

#### 1. **Production Deployment** (Push to main branch)
- Automatically triggers GitHub Actions
- Builds and pushes Docker image to ECR
- Updates App Runner with new image
- Deploys frontends to S3/CloudFront

#### 2. **Dev Deployment** (Label PR with "dev-deploy")
- Add "dev-deploy" label to any PR
- Deploys to development environment
- Uses separate ECR repository and App Runner service

### Next Steps After Terraform Completes

1. **Get ECR Repository URL**:
```bash
ECR_URL=$(terraform output -raw ecr_repository_url)
echo $ECR_URL
```

2. **Build and Push Initial Docker Image**:
```bash
# Login to ECR
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin $ECR_URL

# Build and push (from server directory)
cd ../../server
docker build -t blrplt-server .
docker tag blrplt-server:latest $ECR_URL:latest
docker push $ECR_URL:latest
```

3. **Set GitHub Repository Variables**:
Go to: https://github.com/suka-/arstoien-blrplt/settings/variables/actions

Add this variable:
- Name: `AWS_DEPLOY_ROLE_ARN`
- Value: Will be shown after terraform completes (look for `github_role_arn` output)

4. **Commit and Push Changes**:
```bash
git add .
git commit -m "feat: add AWS infrastructure with App Runner deployment"
git push origin claude/aws-infrastructure-01XSZ8ssNsTSZefPLtYDXeKC
```

### Cost Estimate
- **Monthly**: ~$45-55
- App Runner: ~$30-35/month
- RDS: ~$15/month (free tier first year if eligible)
- Other services: minimal

### Files Created/Modified
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `infrastructure/terraform/github-oidc.tf` - OIDC role for GitHub
- `infrastructure/terraform/terraform.tfvars` - Configuration values
- This deployment summary

### Security Notes
- Using OIDC for GitHub Actions (no stored AWS credentials!)
- All S3 buckets are private with CloudFront access only
- RDS is in private subnets
- SSL certificates for all domains

### Monitoring Deployment
The terraform apply is running in the background. It will take ~10-15 minutes to complete.
Check progress anytime with: `terraform show`