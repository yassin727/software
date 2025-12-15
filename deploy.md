# HMTS Deployment Guide

This guide covers deploying the Home Maid Tracking System (HMTS) to a production environment.

## Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- PM2 for process management
- Nginx for reverse proxy
- SSL certificate (Let's Encrypt recommended)

## Environment Variables

Create a production `.env` file:

```bash
# Server Configuration
PORT=4000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=hmts_user
DB_PASSWORD=your_secure_password
DB_NAME=hmts_production

# Security
JWT_SECRET=your_very_secure_jwt_secret_key_here

# Optional: Email/SMS Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Database Setup

1. **Create Production Database**:
```sql
CREATE DATABASE hmts_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hmts_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON hmts_production.* TO 'hmts_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **Run Migrations**:
```bash
# Import base schema (you'll need to create this from your development DB)
mysql -u hmts_user -p hmts_production < database/schema.sql

# Run migrations
mysql -u hmts_user -p hmts_production < migrations/add_notifications_table.sql
mysql -u hmts_user -p hmts_production < migrations/add_profile_verification_location_tables.sql
```

3. **Seed Data**:
```bash
# Create admin user
node create-admin.js

# Seed menu items
node seed-menu.js
```

## PM2 Process Management

1. **Install PM2 globally**:
```bash
npm install -g pm2
```

2. **Create PM2 ecosystem file** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'hmts-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

3. **Start the application**:
```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

4. **PM2 Management Commands**:
```bash
# View status
pm2 status

# View logs
pm2 logs hmts-api

# Restart application
pm2 restart hmts-api

# Stop application
pm2 stop hmts-api

# Monitor resources
pm2 monit
```

## Nginx Reverse Proxy

1. **Install Nginx**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

2. **Create Nginx configuration** (`/etc/nginx/sites-available/hmts`):
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Static files
    location /uploads/ {
        alias /path/to/your/app/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ @nodejs;
    }

    # Proxy to Node.js application
    location @nodejs {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files from public directory
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /path/to/your/app/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **Enable the site**:
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/hmts /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## HTTPS with Let's Encrypt

1. **Install Certbot**:
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

2. **Obtain SSL Certificate**:
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

3. **Auto-renewal**:
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Firewall Configuration

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Monitoring and Logging

1. **Application Logs**:
```bash
# PM2 logs
pm2 logs hmts-api --lines 100

# System logs
sudo journalctl -u nginx -f
```

2. **Log Rotation**:
```bash
# Configure logrotate for PM2 logs
sudo nano /etc/logrotate.d/pm2

# Add:
/path/to/your/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backup Strategy

1. **Database Backup**:
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u hmts_user -p hmts_production > /backups/hmts_$DATE.sql
gzip /backups/hmts_$DATE.sql

# Keep only last 30 days
find /backups -name "hmts_*.sql.gz" -mtime +30 -delete
```

2. **File Backup**:
```bash
#!/bin/bash
# backup-files.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/hmts_files_$DATE.tar.gz /path/to/your/app/public/uploads
```

## Performance Optimization

1. **Database Optimization**:
```sql
-- Add indexes for better performance
CREATE INDEX idx_jobs_homeowner_status ON jobs(homeowner_id, status);
CREATE INDEX idx_jobs_maid_status ON jobs(maid_id, status);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_attendance_job ON attendance(job_id);
```

2. **Node.js Optimization**:
```javascript
// Add to server.js for production
if (process.env.NODE_ENV === 'production') {
  app.use(compression());
  app.use(helmet());
}
```

## Health Checks

Create a health check endpoint monitoring script:

```bash
#!/bin/bash
# health-check.sh
HEALTH_URL="https://your-domain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Health check passed"
else
    echo "$(date): Health check failed with status $RESPONSE"
    # Restart application
    pm2 restart hmts-api
fi
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] Admin user created
- [ ] Menu items seeded
- [ ] PM2 configured and running
- [ ] Nginx configured with SSL
- [ ] Firewall rules applied
- [ ] Backup scripts configured
- [ ] Health checks implemented
- [ ] Log rotation configured
- [ ] Domain DNS configured
- [ ] SSL certificate obtained and auto-renewal setup

## Troubleshooting

**Common Issues**:

1. **Application won't start**:
   - Check PM2 logs: `pm2 logs hmts-api`
   - Verify environment variables
   - Check database connectivity

2. **502 Bad Gateway**:
   - Ensure Node.js app is running: `pm2 status`
   - Check Nginx configuration: `sudo nginx -t`
   - Verify proxy_pass URL in Nginx config

3. **Database connection errors**:
   - Check MySQL service: `sudo systemctl status mysql`
   - Verify database credentials
   - Check firewall rules for MySQL port

4. **SSL certificate issues**:
   - Verify certificate files exist
   - Check certificate expiration: `sudo certbot certificates`
   - Test renewal: `sudo certbot renew --dry-run`