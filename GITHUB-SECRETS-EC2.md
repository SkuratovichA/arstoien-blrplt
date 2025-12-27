# GitHub Actions Secrets for EC2 Deployment

⚠️ **SECURITY WARNING**: Never commit actual secret values to git!

Add these secrets to your GitHub repository:
Settings → Secrets and variables → Actions → New repository secret

## Required Secrets

### AWS Authentication
- **AWS_ROLE_ARN**: `arn:aws:iam::YOUR_ACCOUNT_ID:role/github-actions-role`
  - Get from terraform output: `terraform output github_role_arn`

### EC2 Deployment
- **EC2_HOST**: The public IP of your EC2 instance
  - Get from terraform output: `terraform output ec2_public_ip`

- **EC2_SSH_KEY**: The private SSH key for EC2 access
  - Get from: `cat keys/blrplt-server.pem`
  - Copy the entire contents including BEGIN/END lines

### Database
- **DATABASE_URL**: PostgreSQL connection string
  - Get from terraform output: `terraform output -raw database_url`
  - Format: `postgresql://user:password@host:5432/database`

### Redis
- **REDIS_URL**: External Redis connection string
  - Use your Redis Labs or other provider URL
  - Format: `redis://default:password@host:port`

### Application Secrets
- **JWT_SECRET**: Your JWT signing secret
  - Generate with: `openssl rand -base64 32`

- **JWT_REFRESH_SECRET**: Your JWT refresh token secret
  - Generate with: `openssl rand -base64 32`

### AWS Services
- **S3_BUCKET**: `blrplt-uploads-production`
  - Or your configured S3 bucket name

### Email (AWS SES)
- **SMTP_USER**: Your AWS SES SMTP username
  - ⚠️ Get from AWS SES Console (NOT IAM credentials)

- **SMTP_PASS**: Your AWS SES SMTP password
  - ⚠️ Get from AWS SES Console (NOT IAM credentials)

- **EMAIL_FROM**: `noreply@your-domain.com`
  - Must be verified in AWS SES

### Frontend URLs
- **FRONTEND_URL**: `https://your-project.your-domain.com`
  - Your main frontend URL

- **ADMIN_FRONTEND_URL**: `https://admin.your-project.your-domain.com`
  - Your admin panel URL

### CloudFront Distribution IDs
- **CLIENT_CLOUDFRONT_ID**: CloudFront distribution ID for client
  - Get from terraform output: `terraform output cloudfront_client_id`

- **ADMIN_CLOUDFRONT_ID**: CloudFront distribution ID for admin
  - Get from terraform output: `terraform output cloudfront_admin_id`

## Setting Secrets via GitHub CLI

You can also set secrets using the GitHub CLI:

```bash
# Install GitHub CLI if needed
# brew install gh

# Login to GitHub
gh auth login

# Set secrets (example)
gh secret set EC2_HOST --body "YOUR_EC2_IP"
gh secret set EC2_SSH_KEY < keys/blrplt-server.pem
gh secret set DATABASE_URL --body "postgresql://..."
```

## Security Best Practices

1. **Never commit secrets to git**
2. **Rotate secrets regularly**
3. **Use strong, randomly generated secrets**
4. **Limit access to production secrets**
5. **Use AWS Secrets Manager or Parameter Store for additional security**

## Troubleshooting

If deployments fail, check:
1. All secrets are properly set in GitHub
2. No trailing spaces or newlines in secrets
3. SSH key has proper format (including headers)
4. Database URL is properly escaped
5. AWS credentials have necessary permissions