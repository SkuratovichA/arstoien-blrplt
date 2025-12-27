# Staging Infrastructure Configuration (EC2-based)

This configuration provides a cost-effective infrastructure setup using EC2 instead of App Runner, reducing costs from ~$102/month to ~$11/month.

## Cost Breakdown

- **EC2 t3.micro**: $7.59/month (or FREE with AWS Free Tier)
- **Elastic IP**: $3.65/month
- **Total**: ~$11/month (91% cost reduction!)

## Features

- ✅ Single EC2 instance (t3.micro)
- ✅ NGINX reverse proxy with SSL (Let's Encrypt)
- ✅ Automatic systemd service management
- ✅ Docker support
- ✅ Node.js application hosting
- ✅ PostgreSQL database (RDS or external)
- ✅ Redis support (external)
- ✅ S3 for file uploads
- ✅ CloudFront CDN for frontend apps
- ✅ SES for email delivery

## Prerequisites

- AWS CLI configured
- Terraform >= 1.0
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
db_password = "secure-password-here"

# External Redis (Redis Labs recommended for cost savings)
external_redis_url = "redis://your-redis-url:port"

# JWT Secrets
jwt_secret = "your-jwt-secret"
jwt_refresh_secret = "your-jwt-refresh-secret"

# SMTP (AWS SES)
smtp_user = "your-ses-smtp-user"
smtp_pass = "your-ses-smtp-password"

# EC2 Configuration
enable_ec2_deployment = true
ec2_instance_type = "t3.micro"  # or "t2.micro" for free tier
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
# Get EC2 public IP
terraform output ec2_public_ip

# Get SSH command
terraform output ssh_command

# Get database URL (sensitive)
terraform output -raw database_url

# Save SSH key
cp keys/blrplt-server.pem ~/.ssh/
chmod 600 ~/.ssh/blrplt-server.pem
```

## Post-Deployment Setup

### 1. Initial Server Setup

SSH into your EC2 instance:

```bash
ssh -i keys/blrplt-server.pem ec2-user@$(terraform output -raw ec2_public_ip)
```

### 2. Deploy Application

The application can be deployed via:

#### Option A: GitHub Actions (Recommended)

Add these secrets to your GitHub repository:
- `EC2_HOST`: The EC2 public IP
- `EC2_SSH_KEY`: Contents of `keys/blrplt-server.pem`
- All environment variables from terraform outputs

#### Option B: Manual Deployment

```bash
# On EC2 instance
cd /app
git clone https://github.com/yourusername/yourrepo.git current
cd current

# Install dependencies
npm install --production --legacy-peer-deps

# Build application
npm run build

# Copy environment file
sudo cp .env.production /app/.env

# Start service
sudo systemctl start blrplt
sudo systemctl enable blrplt
```

### 3. NGINX SSL Setup

The EC2 setup script automatically configures NGINX, but to enable SSL:

```bash
# SSH into EC2
ssh -i keys/blrplt-server.pem ec2-user@$(terraform output -raw ec2_public_ip)

# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourproject.yourdomain.com \
  --non-interactive --agree-tos \
  --email admin@yourdomain.com

# Verify NGINX configuration
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Configure systemd Service

The systemd service is automatically created at `/etc/systemd/system/blrplt.service`:

```ini
[Unit]
Description=Blrplt Node.js Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/app/current
EnvironmentFile=/app/.env
ExecStart=/usr/bin/node dist/main
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=blrplt

[Install]
WantedBy=multi-user.target
```

## NGINX Configuration

NGINX is automatically configured with this setup. The configuration file is located at `/etc/nginx/conf.d/api.conf`:

```nginx
server {
    listen 80;
    server_name api.yourproject.yourdomain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}

# HTTPS configuration (added by Certbot)
server {
    listen 443 ssl http2;
    server_name api.yourproject.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourproject.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourproject.yourdomain.com/privkey.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring & Maintenance

### Check Application Status

```bash
# Check service status
sudo systemctl status blrplt

# View logs
sudo journalctl -u blrplt -f

# Check NGINX status
sudo systemctl status nginx

# View NGINX logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart application
sudo systemctl restart blrplt

# Restart NGINX
sudo systemctl restart nginx

# Reload NGINX config
sudo nginx -s reload
```

### Update Application

```bash
cd /app/current
git pull origin main
npm install --production --legacy-peer-deps
npm run build
sudo systemctl restart blrplt
```

## Troubleshooting

### Application Not Starting

1. Check logs: `sudo journalctl -u blrplt -n 100`
2. Verify environment file: `sudo cat /app/.env`
3. Check Node.js version: `node --version`
4. Verify database connection: `psql $DATABASE_URL`

### NGINX Issues

1. Test configuration: `sudo nginx -t`
2. Check error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify upstream is running: `curl http://localhost:3000/health`

### SSL Certificate Issues

1. Renew certificate: `sudo certbot renew`
2. Test auto-renewal: `sudo certbot renew --dry-run`
3. Check certificate: `sudo certbot certificates`

### Database Connection Issues

1. Check security group allows connection from EC2
2. Verify database is publicly accessible (if needed)
3. Test connection: `psql postgresql://user:pass@host:5432/dbname`

## Backup Strategy

### Database Backup

```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated daily backups (add to crontab)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

### Application Backup

```bash
# Backup application files
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /app/current
```

## Security Considerations

1. **SSH Access**: Restrict SSH to specific IPs in security group
2. **Database**: Use RDS with encryption and private subnets if possible
3. **Secrets**: Store in AWS Secrets Manager or Parameter Store
4. **Updates**: Regularly update system packages: `sudo dnf update -y`
5. **Firewall**: Use AWS Security Groups to restrict access
6. **SSL**: Always use HTTPS in production

## Cost Optimization Tips

1. **Use Spot Instances**: Set `use_spot_instance = true` for ~70% savings
2. **Reserved Instances**: Purchase 1-year reserved for ~30% savings
3. **Free Tier**: Use t2.micro for first 12 months free
4. **External Services**: Use free Redis Labs instead of ElastiCache
5. **Database**: Consider Aurora Serverless v2 for variable workloads

## Scaling Options

When you need to scale:

1. **Vertical Scaling**: Change instance type (t3.micro → t3.small)
2. **Add Load Balancer**: Transition to ALB + Auto Scaling Group
3. **Database Scaling**: Move to Aurora or add read replicas
4. **CDN**: CloudFront is already configured for static assets
5. **Migration Path**: Use the production-config for full App Runner setup

## Support

For issues or questions:
1. Check application logs: `sudo journalctl -u blrplt -f`
2. Review NGINX logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables: `sudo cat /app/.env`
4. Test health endpoint: `curl https://api.yourproject.yourdomain.com/health`

## Related Documentation

- [Expensive Config (App Runner)](../production-config/README.md)
- [Main Infrastructure Documentation](../README.md)
- [GitHub Secrets Setup](../../../GITHUB-SECRETS-EC2.md)
- [Migration Guide](../EC2-MIGRATION-GUIDE.md)