# AWS Infrastructure

This directory contains Infrastructure as Code (IaC) using Terraform for deploying the Blrplt application to AWS.

## Architecture Overview

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                         AWS Cloud                           │
                                    │                                                             │
    ┌──────────┐                    │  ┌─────────────────────────────────────────────────────┐   │
    │  Users   │────────────────────┼─▶│                     CloudFront                       │   │
    └──────────┘                    │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
                                    │  │  │   Client    │  │    Admin    │  │     API     │  │   │
                                    │  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
                                    │  └─────────┼────────────────┼────────────────┼─────────┘   │
                                    │            │                │                │             │
                                    │            ▼                ▼                ▼             │
                                    │  ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐   │
                                    │  │   S3 (Client)   │ │   S3 (Admin)    │ │    ALB     │   │
                                    │  │   Static Files  │ │   Static Files  │ │            │   │
                                    │  └─────────────────┘ └─────────────────┘ └─────┬──────┘   │
                                    │                                                │          │
                                    │                                   ┌────────────┘          │
                                    │                                   │                       │
                                    │  ┌────────────────────────────────┼──────────────────┐    │
                                    │  │              VPC               │                  │    │
                                    │  │                                ▼                  │    │
                                    │  │  ┌──────────────────────────────────────────────┐ │    │
                                    │  │  │          Private Subnets                      │ │    │
                                    │  │  │                                               │ │    │
                                    │  │  │   ┌─────────────┐     ┌─────────────────┐    │ │    │
                                    │  │  │   │  ECS Fargate│     │     RDS         │    │ │    │
                                    │  │  │   │   Server    │────▶│  PostgreSQL 15  │    │ │    │
                                    │  │  │   └──────┬──────┘     └─────────────────┘    │ │    │
                                    │  │  │          │                                   │ │    │
                                    │  │  │          │            ┌─────────────────┐    │ │    │
                                    │  │  │          └───────────▶│   ElastiCache   │    │ │    │
                                    │  │  │                       │     Redis 7     │    │ │    │
                                    │  │  │                       └─────────────────┘    │ │    │
                                    │  │  └──────────────────────────────────────────────┘ │    │
                                    │  └───────────────────────────────────────────────────┘    │
                                    │                                                           │
                                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
                                    │  │     WAF     │  │    ECR      │  │  Route 53   │       │
                                    │  │  (DDoS)     │  │  (Images)   │  │  (DNS)      │       │
                                    │  └─────────────┘  └─────────────┘  └─────────────┘       │
                                    └───────────────────────────────────────────────────────────┘
```

## Components

| Component | Description |
|-----------|-------------|
| **VPC** | Virtual Private Cloud with public/private subnets across 3 AZs |
| **ALB** | Application Load Balancer for the server API with SSL termination |
| **ECS Fargate** | Containerized server deployment with auto-scaling |
| **RDS PostgreSQL** | Managed PostgreSQL 15 database with encryption |
| **ElastiCache Redis** | Managed Redis 7 for caching and sessions |
| **S3** | Static file hosting for client and admin apps |
| **CloudFront** | CDN for global content delivery and caching |
| **WAF** | Web Application Firewall for DDoS protection |
| **Route 53** | DNS management (optional) |
| **ECR** | Container registry for Docker images |

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** v1.6.0 or later
3. **Docker** for building container images
4. **AWS Account** with sufficient permissions

## Quick Start

### 1. Initialize Terraform

```bash
cd infrastructure/terraform/environments/production
terraform init
```

### 2. Configure Variables

Copy the example variables file and fill in your values:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Plan and Apply

```bash
# Preview changes
terraform plan

# Apply changes
terraform apply
```

## Directory Structure

```
infrastructure/
├── terraform/
│   ├── main.tf              # Main configuration
│   ├── variables.tf         # Input variables
│   ├── outputs.tf           # Output values
│   ├── modules/
│   │   ├── vpc/             # VPC, subnets, NAT gateway
│   │   ├── ecr/             # Container registries
│   │   ├── rds/             # PostgreSQL database
│   │   ├── elasticache/     # Redis cluster
│   │   ├── s3/              # S3 buckets
│   │   ├── alb/             # Application Load Balancer
│   │   ├── ecs/             # ECS cluster and services
│   │   ├── cloudfront/      # CDN distributions
│   │   ├── waf/             # Web Application Firewall
│   │   └── route53/         # DNS records
│   └── environments/
│       ├── production/      # Production environment
│       └── preview/         # PR preview environment
└── README.md
```

## GitHub Actions Secrets

The following secrets must be configured in your GitHub repository:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for deployments |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key |
| `PRODUCTION_API_URL` | Production API URL (e.g., `https://api.example.com`) |
| `PRODUCTION_WS_URL` | Production WebSocket URL (e.g., `wss://api.example.com`) |
| `PRODUCTION_GRAPHQL_URL` | Production GraphQL URL |
| `PRODUCTION_DATABASE_URL` | Production database connection string |
| `CLIENT_S3_BUCKET` | Client S3 bucket name |
| `ADMIN_S3_BUCKET` | Admin S3 bucket name |
| `CLIENT_CLOUDFRONT_DISTRIBUTION_ID` | Client CloudFront distribution ID |
| `ADMIN_CLOUDFRONT_DISTRIBUTION_ID` | Admin CloudFront distribution ID |
| `ECS_CLUSTER_ARN` | ECS cluster ARN |
| `ECS_EXECUTION_ROLE_ARN` | ECS task execution role ARN |
| `ECS_TASK_ROLE_ARN` | ECS task role ARN |
| `TERRAFORM_STATE_BUCKET` | S3 bucket for Terraform state |
| `PREVIEW_DATABASE_URL` | Preview database connection string |
| `PREVIEW_REDIS_URL` | Preview Redis connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |

## Deployment Workflows

### Production Deployment

Automatically triggered on push to `main` branch:

1. Waits for CI checks to pass
2. Builds and pushes Docker images to ECR
3. Builds and deploys client/admin to S3
4. Updates ECS service with new image
5. Runs database migrations
6. Invalidates CloudFront cache

### PR Preview Deployment

Triggered when `deploy` label is added to a PR:

1. Waits for CI checks to pass
2. Creates preview infrastructure with Terraform
3. Deploys server to ECS (single task with public IP)
4. Deploys client/admin to S3 with public access
5. Comments on PR with preview URLs
6. Automatically destroyed when PR is closed or label removed

## Cost Estimation (Production)

| Resource | Instance Type | Estimated Monthly Cost |
|----------|---------------|------------------------|
| ECS Fargate (2 tasks) | 0.5 vCPU, 1GB | ~$30 |
| RDS PostgreSQL | db.t3.small | ~$25 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| ALB | Standard | ~$20 |
| CloudFront | First 1TB | ~$8 |
| S3 | First 50GB | ~$2 |
| NAT Gateway | Per hour + data | ~$35 |
| **Total** | | **~$130/month** |

*Prices are approximate and vary by region and usage.*

## Security Features

- **WAF Rules**: SQL injection, XSS, rate limiting protection
- **Private Subnets**: Database and server not publicly accessible
- **Encryption**: RDS and S3 encryption at rest
- **HTTPS Only**: ALB and CloudFront enforce HTTPS
- **Security Groups**: Fine-grained network access control
- **IAM Roles**: Least privilege access for ECS tasks

## Scaling

The ECS service is configured with auto-scaling based on:

- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Min tasks: 1
- Max tasks: 10

## Monitoring

- **CloudWatch Logs**: All ECS logs are sent to CloudWatch
- **CloudWatch Metrics**: CPU, memory, request counts
- **RDS Performance Insights**: Database query analysis
- **WAF Logs**: Security event logging

## Troubleshooting

### Common Issues

1. **Terraform state lock**: Run `terraform force-unlock <LOCK_ID>`
2. **ECS deployment stuck**: Check CloudWatch logs for container errors
3. **Database connection failed**: Verify security group rules

### Useful Commands

```bash
# View ECS service events
aws ecs describe-services --cluster blrplt-production-cluster --services blrplt-production-server

# View ECS task logs
aws logs tail /ecs/blrplt-production/server --follow

# Connect to RDS (via bastion host)
psql -h <rds-endpoint> -U blrplt_admin -d blrplt_db
```
