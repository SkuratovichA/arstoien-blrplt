#!/bin/bash
# =============================================================================
# EC2 Setup Script - Installs Docker and runs the application
# =============================================================================

# Exit on error
set -e

# Log everything
exec > >(tee -a /var/log/user-data.log)
exec 2>&1

echo "Starting EC2 setup for ${project_name}..."

# -----------------------------------------------------------------------------
# System Updates
# -----------------------------------------------------------------------------
echo "Updating system packages..."
dnf update -y
dnf install -y docker git nginx certbot python3-certbot-nginx htop

# -----------------------------------------------------------------------------
# Docker Setup
# -----------------------------------------------------------------------------
echo "Setting up Docker..."
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# -----------------------------------------------------------------------------
# Node.js Setup (optional - if not using Docker)
# -----------------------------------------------------------------------------
echo "Installing Node.js..."
curl -sL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

# -----------------------------------------------------------------------------
# Create application directory
# -----------------------------------------------------------------------------
mkdir -p /app
cd /app

# -----------------------------------------------------------------------------
# Create environment file
# -----------------------------------------------------------------------------
cat > /app/.env << 'EOF'
NODE_ENV=${node_env}
PORT=3000
DATABASE_URL=${database_url}
REDIS_URL=${redis_url}
JWT_SECRET=${jwt_secret}
JWT_REFRESH_SECRET=${jwt_refresh_secret}
S3_BUCKET=${s3_bucket}
AWS_REGION=${aws_region}
FRONTEND_URL=${frontend_url}
ADMIN_FRONTEND_URL=${admin_url}
SMTP_HOST=${smtp_host}
SMTP_PORT=${smtp_port}
SMTP_USER=${smtp_user}
SMTP_PASS=${smtp_pass}
EMAIL_FROM=${email_from}
EOF

# -----------------------------------------------------------------------------
# Create Docker Compose file
# -----------------------------------------------------------------------------
cat > /app/docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    image: ${project_name}-server:latest
    container_name: ${project_name}-server
    ports:
      - "3000:3000"
    env_file: .env
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF

# -----------------------------------------------------------------------------
# Nginx Configuration (Reverse Proxy)
# -----------------------------------------------------------------------------
cat > /etc/nginx/conf.d/${project_name}.conf << 'NGINX'
server {
    listen 80;
    server_name ${api_url};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
NGINX

# Start Nginx
systemctl start nginx
systemctl enable nginx

# -----------------------------------------------------------------------------
# Create deployment script
# -----------------------------------------------------------------------------
cat > /usr/local/bin/deploy.sh << 'DEPLOY'
#!/bin/bash
# Simple deployment script

echo "Deploying ${project_name}..."

# Pull latest image from ECR (if using ECR)
# aws ecr get-login-password --region ${aws_region} | docker login --username AWS --password-stdin ${ecr_registry}
# docker pull ${ecr_registry}/${project_name}-server:latest

# Or build locally (if code is cloned)
if [ -d "/app/source" ]; then
    cd /app/source
    git pull
    docker build -t ${project_name}-server:latest -f packages/server/Dockerfile .
fi

# Restart application
cd /app
docker-compose down
docker-compose up -d

echo "Deployment complete!"
DEPLOY

chmod +x /usr/local/bin/deploy.sh

# -----------------------------------------------------------------------------
# Create systemd service for app (alternative to Docker)
# -----------------------------------------------------------------------------
cat > /etc/systemd/system/${project_name}.service << 'SYSTEMD'
[Unit]
Description=${project_name} Node.js Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/app
ExecStart=/usr/bin/node /app/packages/server/dist/main.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/${project_name}.log
StandardError=append:/var/log/${project_name}-error.log
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SYSTEMD

# -----------------------------------------------------------------------------
# CloudWatch Agent Setup (optional)
# -----------------------------------------------------------------------------
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# -----------------------------------------------------------------------------
# Create a simple health check endpoint responder
# -----------------------------------------------------------------------------
cat > /usr/local/bin/health-server.js << 'HEALTH'
const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    exec('docker ps | grep ${project_name}-server', (error) => {
      if (error) {
        res.writeHead(503);
        res.end('Service Unavailable');
      } else {
        res.writeHead(200);
        res.end('OK');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(8080, '127.0.0.1');
console.log('Health check server running on port 8080');
HEALTH

# -----------------------------------------------------------------------------
# Set up log rotation
# -----------------------------------------------------------------------------
cat > /etc/logrotate.d/${project_name} << 'LOGROTATE'
/var/log/${project_name}*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 ec2-user ec2-user
}
LOGROTATE

# -----------------------------------------------------------------------------
# Final setup
# -----------------------------------------------------------------------------
echo "EC2 setup complete!"
echo "Server IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "API endpoint will be available at: ${api_url}"

# For now, run a simple Node.js server as placeholder
cd /app
cat > server.js << 'NODE'
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', instance: '${project_name}' });
});

app.get('/', (req, res) => {
  res.json({
    message: 'API Server Running',
    environment: '${node_env}',
    instance: '${project_name}'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
NODE

# Install express
npm init -y
npm install express

# Start the placeholder server
nohup node server.js > /var/log/${project_name}-app.log 2>&1 &

echo "Placeholder server started on port 3000"