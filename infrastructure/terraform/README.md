# Terraform Infrastructure Configurations

This directory contains two terraform configuration templates for different deployment scenarios:

## Directory Structure

```
terraform/
├── staging-config/     # EC2-based configuration (~$11/month)
├── production-config/  # App Runner configuration (~$102/month)
└── keys/              # SSH keys (gitignored)
```

## Configuration Options

### 1. Staging Configuration (EC2-based)
**Location:** `staging-config/`
**Monthly Cost:** ~$11/month
**Best for:** Development, staging environments, cost-conscious deployments

**Features:**
- Single EC2 instance (t3.micro)
- NGINX reverse proxy with Let's Encrypt SSL
- Manual scaling
- Direct SSH access for debugging

**To deploy:**
```bash
cd staging-config
terraform init
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform apply
```

### 2. Production Configuration (App Runner)
**Location:** `production-config/`
**Monthly Cost:** ~$102/month
**Best for:** Production workloads with auto-scaling needs

**Features:**
- AWS App Runner (fully managed)
- Automatic scaling (1-10 instances)
- Zero-downtime deployments
- Built-in load balancing

**To deploy:**
```bash
cd production-config
terraform init
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform apply
```

## Important Notes

### Active Infrastructure
The staging-config directory contains the terraform state for the currently deployed infrastructure. The state files are:
- `.terraform/` - Terraform plugins
- `terraform.tfstate` - Current state
- `terraform.tfstate.backup` - Previous state

⚠️ **WARNING:** Do not delete these state files if you have active infrastructure deployed.

### Choosing Between Configurations

| Factor | Staging Config (EC2) | Production Config (App Runner) |
|--------|---------------------|-------------------------------|
| Monthly Cost | ~$11 | ~$102 |
| Scaling | Manual | Automatic (1-10 instances) |
| Management | Self-managed | Fully managed |
| Deployment | SSH/GitHub Actions | GitHub Actions |
| SSL/HTTPS | Manual setup with Certbot | Automatic |
| Maintenance | Regular updates needed | AWS managed |
| Best For | Dev/Staging/Small apps | Production/High-traffic |

### Migration Between Configurations

To migrate from one configuration to another:

1. **Export important data** (database, environment variables)
2. **Deploy new infrastructure** in the target configuration
3. **Update DNS records** to point to new infrastructure
4. **Test thoroughly** before decommissioning old infrastructure
5. **Destroy old infrastructure** to avoid double billing

### Cost Optimization Tips

**For Staging Config:**
- Use t2.micro for AWS Free Tier eligibility
- Consider spot instances for non-critical workloads
- Use external services (Redis Labs, etc.) with free tiers

**For Production Config:**
- Adjust min/max instances based on actual traffic
- Monitor CloudWatch metrics to optimize instance size
- Consider reserved capacity for long-term savings

## Support

For detailed setup instructions, see:
- [Staging Config README](./staging-config/README.md)
- [Production Config README](./production-config/README.md)