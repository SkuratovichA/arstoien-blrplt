# EC2 Migration Guide - From App Runner to EC2

## Cost Savings Summary
- **Before**: App Runner ($65.70/month) + Other services (~$30/month) = **~$93/month**
- **After**: EC2 t3.micro ($7.59/month) + Other services (~$10/month) = **~$15-20/month**
- **Total Savings**: **~$73/month ($876/year)**

## Prerequisites
1. AWS CLI configured with proper credentials
2. Terraform installed (v1.0+)
3. Git access to your repository
4. Docker installed on EC2 (handled by setup script)

## Migration Steps

### Step 1: Prepare the Infrastructure

1. **Verify EC2 configuration is in place**:
   ```bash
   cd infrastructure/terraform
   ls -la compute.tf  # Should be the EC2 version
   ls -la variables-ec2.tf  # EC2 variables should be appended to variables.tf
   ```

2. **Create SSH key directory**:
   ```bash
   mkdir -p keys
   chmod 700 keys
   ```

3. **Verify terraform.tfvars has EC2 enabled**:
   ```bash
   grep "enable_ec2_deployment" terraform.tfvars
   # Should show: enable_ec2_deployment = true
   ```

### Step 2: Deploy EC2 Infrastructure

1. **Run terraform plan to see changes**:
   ```bash
   terraform plan
   ```

   Expected changes:
   - ✅ Create EC2 instance
   - ✅ Create Elastic IP
   - ✅ Create security groups
   - ✅ Create IAM roles and policies
   - ✅ Create SSH key pair
   - ❌ Destroy App Runner service
   - ❌ Destroy VPC connector

2. **Apply the EC2 infrastructure**:
   ```bash
   terraform apply -auto-approve
   ```

3. **Save the SSH key** (automatically created in `keys/` directory):
   ```bash
   chmod 600 keys/blrplt-server.pem
   ```

### Step 3: Verify EC2 Instance

1. **SSH into the instance**:
   ```bash
   ssh -i keys/blrplt-server.pem ec2-user@$(terraform output -raw ec2_public_ip)
   ```

2. **Check the setup logs**:
   ```bash
   sudo tail -f /var/log/user-data.log
   ```

3. **Verify services are running**:
   ```bash
   # Check Docker
   sudo docker ps

   # Check Nginx
   sudo systemctl status nginx

   # Check Node.js placeholder
   curl http://localhost:3000/health
   ```

### Step 4: Deploy Your Application

1. **Option A: Deploy via Docker** (Recommended)

   SSH into the EC2 instance and run:
   ```bash
   cd /app

   # Clone your repository
   git clone https://github.com/your-username/arstoien-blrplt.git source
   cd source

   # Build Docker image
   sudo docker build -t blrplt-server:latest -f packages/server/Dockerfile .

   # Run deployment script
   sudo /usr/local/bin/deploy.sh
   ```

2. **Option B: Deploy via Node.js directly**

   ```bash
   cd /app
   git clone https://github.com/your-username/arstoien-blrplt.git source
   cd source

   # Install dependencies
   yarn install
   yarn build

   # Copy built files
   cp -r packages/server/dist/* /app/

   # Restart service
   sudo systemctl restart blrplt
   ```

### Step 5: Update DNS and Test

1. **Wait for DNS propagation** (5-10 minutes):
   ```bash
   # Test direct IP access first
   curl http://$(terraform output -raw ec2_public_ip):3000/health

   # Then test via domain
   curl https://api.blrplt.arstoien.com/health
   ```

2. **Monitor logs**:
   ```bash
   # Application logs
   sudo tail -f /var/log/blrplt-app.log

   # Nginx logs
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

### Step 6: Remove App Runner (After Verification)

Once EC2 is working properly:

1. **Manually delete App Runner service**:
   ```bash
   # First, update the service to remove VPC connector
   aws apprunner update-service \
     --service-arn arn:aws:apprunner:eu-central-1:408937187122:service/blrplt-server/bbf409ab8abe45698bff597464fcacde \
     --region eu-central-1 \
     --network-configuration "EgressConfiguration={EgressType=DEFAULT}"

   # Wait for update to complete (5-10 minutes)

   # Then delete the service
   aws apprunner delete-service \
     --service-arn arn:aws:apprunner:eu-central-1:408937187122:service/blrplt-server/bbf409ab8abe45698bff597464fcacde \
     --region eu-central-1
   ```

2. **Remove App Runner from Terraform state**:
   ```bash
   # Remove from state to prevent Terraform from trying to delete
   terraform state rm aws_apprunner_service.server
   terraform state rm aws_apprunner_vpc_connector.server
   terraform state rm aws_apprunner_custom_domain_association.api
   terraform state rm aws_apprunner_auto_scaling_configuration_version.server
   ```

3. **Clean up old files**:
   ```bash
   rm compute-apprunner.tf.backup  # After confirming EC2 works
   ```

## Deployment Options

### GitHub Actions Deployment to EC2

Update `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to EC2
        env:
          PRIVATE_KEY: ${{ secrets.EC2_PRIVATE_KEY }}
          HOST: ${{ secrets.EC2_HOST }}
        run: |
          echo "$PRIVATE_KEY" > private_key.pem
          chmod 600 private_key.pem

          # Copy files
          scp -i private_key.pem -r packages/server/* ec2-user@$HOST:/app/source/

          # Run deployment
          ssh -i private_key.pem ec2-user@$HOST "sudo /usr/local/bin/deploy.sh"
```

### Manual Deployment Script

Save as `deploy-to-ec2.sh`:

```bash
#!/bin/bash
EC2_IP=$(cd infrastructure/terraform && terraform output -raw ec2_public_ip)
KEY_PATH="infrastructure/terraform/keys/blrplt-server.pem"

echo "Deploying to EC2 at $EC2_IP..."

# Build locally
yarn build

# Copy files
scp -i $KEY_PATH -r packages/server/dist/* ec2-user@$EC2_IP:/app/

# Restart service
ssh -i $KEY_PATH ec2-user@$EC2_IP "sudo systemctl restart blrplt"

echo "Deployment complete!"
```

## Monitoring and Maintenance

### Health Checks
- Direct: `http://{EC2_IP}:3000/health`
- Via Domain: `https://api.blrplt.arstoien.com/health`

### Log Files
- Application: `/var/log/blrplt-app.log`
- Error logs: `/var/log/blrplt-error.log`
- User data: `/var/log/user-data.log`
- Nginx: `/var/log/nginx/*.log`

### Common Commands
```bash
# Restart application
sudo systemctl restart blrplt

# View logs
sudo journalctl -u blrplt -f

# Check disk space
df -h

# Monitor resources
htop
```

## Rollback Plan

If you need to rollback to App Runner:

1. **Restore App Runner configuration**:
   ```bash
   mv compute.tf compute-ec2.tf.backup
   mv compute-apprunner.tf.backup compute.tf
   ```

2. **Update terraform.tfvars**:
   ```bash
   # Set enable_ec2_deployment = false
   ```

3. **Apply changes**:
   ```bash
   terraform apply
   ```

## Cost Optimization Tips

1. **Use Spot Instances** (extra 70% savings):
   ```hcl
   use_spot_instance = true
   spot_max_price = "0.004"
   ```

2. **Use t2.micro** for free tier (if eligible):
   ```hcl
   ec2_instance_type = "t2.micro"  # Free for 12 months
   ```

3. **Reduce storage** if not needed:
   ```hcl
   ec2_volume_size = 8  # Minimum for Amazon Linux
   ```

4. **Enable CloudWatch only when needed**:
   - CloudWatch logs cost ~$0.50/GB
   - Disable detailed monitoring to save costs

## Security Considerations

1. **Restrict SSH access** in security group:
   - Update security group to only allow your IP
   - Use Systems Manager Session Manager instead of SSH

2. **Enable SSL/TLS** with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d api.blrplt.arstoien.com
   ```

3. **Regular updates**:
   ```bash
   sudo yum update -y
   ```

## Troubleshooting

### Issue: Cannot connect to EC2
- Check security group allows port 22 from your IP
- Verify instance is running: `aws ec2 describe-instances`
- Check SSH key permissions: `chmod 600 keys/*.pem`

### Issue: Application not responding
- Check if port 3000 is open in security group
- Verify Nginx is running: `sudo systemctl status nginx`
- Check application logs: `sudo tail -f /var/log/blrplt-app.log`

### Issue: Database connection fails
- Verify RDS is publicly accessible
- Check security group allows connections
- Test connection: `psql -h {rds_endpoint} -U blrplt -d blrplt`

## Support

For issues or questions:
- Check logs in `/var/log/`
- Monitor AWS CloudWatch
- Review Terraform state: `terraform show`

## Next Steps

After successful migration:
1. ✅ Monitor for 24-48 hours
2. ✅ Set up CloudWatch alarms
3. ✅ Configure automated backups
4. ✅ Document any custom configurations
5. ✅ Update CI/CD pipelines
6. ✅ Remove App Runner resources
7. ✅ Celebrate saving $876/year! 🎉