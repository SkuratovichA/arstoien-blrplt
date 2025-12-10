# Terraform Structure

Your Terraform configuration has been refactored from a single 872-line `main.tf` into modular, focused files.

## File Structure

```
infrastructure/terraform/
├── main.tf              # Providers and local variables (68 lines)
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── dns.tf               # Route53 DNS records
├── certificates.tf      # ACM SSL certificates
├── iam.tf               # IAM roles and policies
├── compute.tf           # ECR, App Runner service
├── storage.tf           # S3 buckets, CloudFront
├── database.tf          # RDS, ElastiCache, VPC
├── email.tf             # AWS SES email service
├── github-oidc.tf       # GitHub Actions OIDC (existing)
├── terraform.tfvars     # Variable values
└── main.tf.backup       # Original main.tf backup
```

## File Descriptions

### `main.tf` (68 lines)
Minimal configuration with:
- Terraform version and provider requirements
- AWS provider configuration (default + us-east-1 for CloudFront)
- Local variables for domain structure

### `dns.tf` (43 lines)
Route53 DNS management:
- Route53 zone data source
- DNS record for API (App Runner)
- DNS records for client/admin (CloudFront A records)

### `certificates.tf` (78 lines)
SSL certificate management:
- ACM certificate for API (regional)
- ACM certificate for CloudFront (us-east-1)
- DNS validation records
- Certificate validation resources

### `iam.tf` (116 lines)
IAM roles and policies:
- App Runner ECR access role
- App Runner instance role
- S3 access policy (for uploads)
- SES SMTP user and credentials

### `compute.tf` (151 lines)
Container and compute resources:
- ECR repository (with lifecycle policy)
- App Runner service configuration
- App Runner auto-scaling
- App Runner VPC connector
- Custom domain association

### `storage.tf` (269 lines)
S3 and CloudFront resources:
- S3 buckets (client, admin, uploads)
- Bucket access blocks
- CloudFront distributions
- Origin access controls
- Bucket policies
- CORS configuration

### `database.tf` (164 lines)
Database and cache resources:
- VPC data sources
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- Security groups
- Database URL local variable

### `email.tf` (68 lines)
Email service configuration:
- SES domain identity
- Domain verification (TXT record)
- DKIM records (3 CNAME records)
- Mail FROM domain configuration
- SPF record

## Benefits

### 1. **Easier Navigation**
Find resources by category instead of scrolling through 800+ lines.

### 2. **Better Collaboration**
Multiple team members can work on different services without merge conflicts.

### 3. **Clearer Dependencies**
See what resources depend on each other within each service.

### 4. **Simpler Reviews**
Review changes by service (e.g., "only storage changes" vs. "entire infrastructure").

### 5. **Logical Grouping**
Resources are grouped by AWS service or functional area.

## Usage

All terraform commands work the same:

```bash
cd infrastructure/terraform

# Initialize
terraform init

# Plan
terraform plan

# Apply
terraform apply

# Destroy
terraform destroy
```

Terraform automatically loads all `.tf` files in the directory.

## Resource References

Resources can reference each other across files:

```hcl
# In compute.tf
resource "aws_apprunner_service" "server" {
  # References IAM role from iam.tf
  instance_role_arn = aws_iam_role.apprunner_instance.arn

  # References security group from database.tf
  security_groups = [aws_security_group.apprunner[0].id]

  # References local from main.tf
  name = local.api_domain
}
```

## Backup

The original `main.tf` has been backed up to `main.tf.backup` for reference.

## Important Notes

- **No functional changes**: The infrastructure remains exactly the same
- **Same state file**: Terraform will recognize all resources (no re-creation needed)
- **GitHub Actions**: No changes needed - they reference service ARN which hasn't changed
- **Safe to apply**: Running `terraform plan` will show no changes (just formatting differences)

## Testing

You can verify the refactor worked by running:

```bash
terraform plan
```

You should see: `No changes. Your infrastructure matches the configuration.`
