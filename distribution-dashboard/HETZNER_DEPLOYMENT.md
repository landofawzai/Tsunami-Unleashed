# Hetzner VPS Deployment Guide

## Server Specifications

**Recommended Hetzner Plan:**
- **CX11** (€4.15/month) - Good for testing
- **CX21** (€5.83/month) - Recommended for production
  - 2 vCPU
  - 4 GB RAM
  - 40 GB SSD
  - 20 TB traffic

**OS**: Ubuntu 22.04 LTS

---

## Step 1: Initial Server Setup

### Connect to Your Server

```bash
ssh root@your-server-ip
```

### Update System

```bash
apt update && apt upgrade -y
```

### Create Non-Root User (Recommended)

```bash
# Create user
adduser tsunami
usermod -aG sudo tsunami

# Switch to new user
su - tsunami
```

---

## Step 2: Install Required Software

### Install Node.js 18

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Install nginx (Web Server)

```bash
sudo apt install -y nginx
```

### Install Certbot (SSL Certificates)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## Step 3: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 4: Deploy Application

### Clone Repository

```bash
# Navigate to web directory
cd /var/www

# Clone repo (you may need to use HTTPS instead of SSH)
sudo git clone https://github.com/landofawzai/Tsunami-Unleashed.git
sudo chown -R tsunami:tsunami Tsunami-Unleashed
cd Tsunami-Unleashed/distribution-dashboard
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

```bash
# Create production environment file
nano .env
```

Paste this configuration:

```env
# Database
DATABASE_URL="file:./prod.db"

# API Authentication
API_KEY="<generate-secure-random-string>"

# Next.js
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NODE_ENV="production"
```

**Generate secure API key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save and exit (Ctrl+X, Y, Enter)

### Initialize Database

```bash
# Push schema to database
npm run db:push

# Seed with initial data
npm run db:seed
```

### Build Application

```bash
npm run build
```

---

## Step 5: Start Application with PM2

```bash
# Start app
pm2 start npm --name "tsunami-dashboard" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

### Verify Application is Running

```bash
# Check PM2 status
pm2 list

# View logs
pm2 logs tsunami-dashboard

# Test locally
curl http://localhost:3000
```

---

## Step 6: Configure nginx

### Create nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/tsunami-dashboard
```

Paste this configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

    # Optimize static assets
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/tsunami-dashboard /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

---

## Step 7: Set Up SSL (HTTPS)

### Configure DNS First

Before running Certbot, ensure your domain points to your Hetzner server:

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add/Update DNS A record:
   - **Type**: A
   - **Name**: @ (or yourdomain.com)
   - **Value**: Your Hetzner server IP
   - **TTL**: 300
3. Add www subdomain (optional):
   - **Type**: A
   - **Name**: www
   - **Value**: Your Hetzner server IP

Wait 5-10 minutes for DNS to propagate.

### Verify DNS

```bash
# Check if domain resolves to your server
dig yourdomain.com +short
# Should show your Hetzner server IP
```

### Install SSL Certificate

```bash
# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)
```

### Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

## Step 8: Verify Deployment

### Check Application Status

```bash
# PM2 status
pm2 status

# nginx status
sudo systemctl status nginx

# View logs
pm2 logs tsunami-dashboard --lines 50
```

### Test in Browser

1. Open `https://yourdomain.com`
2. Should see the dashboard with navigation
3. Test all pages:
   - Dashboard (/)
   - Content (/content)
   - Platforms (/platforms)
   - Feeds (/feeds)
   - Metrics (/metrics)
   - Alerts (/alerts)
   - Settings (/settings)

### Test API Endpoints

```bash
# Test stats endpoint
curl https://yourdomain.com/api/dashboard/stats

# Test webhook (replace YOUR_API_KEY)
curl -X POST https://yourdomain.com/api/webhooks/content-posted \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "contentId": "test-001",
    "title": "Test Content",
    "contentType": "video",
    "tier": 3,
    "platform": "YouTube",
    "platformsTargeted": 1,
    "managementTool": "Followr"
  }'
```

---

## Step 9: Set Up Automated Backups

### Database Backup Script

```bash
# Create backup directory
sudo mkdir -p /var/backups/tsunami-dashboard
sudo chown tsunami:tsunami /var/backups/tsunami-dashboard

# Create backup script
nano ~/backup-dashboard.sh
```

Paste this script:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/tsunami-dashboard"
DB_PATH="/var/www/Tsunami-Unleashed/distribution-dashboard/prod.db"

# Create backup
cp $DB_PATH $BACKUP_DIR/prod.db.$DATE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "prod.db.*" -mtime +30 -delete

echo "Backup completed: prod.db.$DATE"
```

Make it executable:

```bash
chmod +x ~/backup-dashboard.sh
```

### Schedule Daily Backups

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /home/tsunami/backup-dashboard.sh >> /home/tsunami/backup.log 2>&1
```

---

## Step 10: Updating the Application

When you push changes to GitHub:

```bash
# SSH into server
ssh tsunami@your-server-ip

# Navigate to project
cd /var/www/Tsunami-Unleashed/distribution-dashboard

# Pull latest changes
git pull origin master

# Install any new dependencies
npm install

# Run database migrations (if schema changed)
npm run db:push

# Rebuild application
npm run build

# Restart application
pm2 restart tsunami-dashboard
```

### Automated Updates (Optional)

Create update script:

```bash
nano ~/update-dashboard.sh
```

```bash
#!/bin/bash
cd /var/www/Tsunami-Unleashed/distribution-dashboard
git pull origin master
npm install
npm run build
pm2 restart tsunami-dashboard
echo "Dashboard updated at $(date)"
```

Make executable:

```bash
chmod +x ~/update-dashboard.sh
```

---

## Monitoring & Maintenance

### PM2 Monitoring

```bash
# View all processes
pm2 list

# Monitor in real-time
pm2 monit

# View detailed info
pm2 info tsunami-dashboard

# View logs (live)
pm2 logs

# View logs (last 100 lines)
pm2 logs tsunami-dashboard --lines 100
```

### nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### System Resources

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check running processes
pm2 monit
```

### Database Maintenance

```bash
cd /var/www/Tsunami-Unleashed/distribution-dashboard

# Vacuum database (optimize)
sqlite3 prod.db "VACUUM;"

# Check database size
du -h prod.db

# View database with Prisma Studio (local only)
npm run db:studio
```

---

## Security Best Practices

### 1. Secure SSH

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended settings:
PermitRootLogin no
PasswordAuthentication no  # Use SSH keys only
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 2. Fail2Ban (Prevent Brute Force)

```bash
# Install
sudo apt install -y fail2ban

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 3. Regular Updates

```bash
# Schedule weekly updates
sudo nano /etc/cron.weekly/system-update
```

```bash
#!/bin/bash
apt update
apt upgrade -y
apt autoremove -y
```

```bash
sudo chmod +x /etc/cron.weekly/system-update
```

### 4. File Permissions

```bash
cd /var/www/Tsunami-Unleashed/distribution-dashboard

# Secure .env file
chmod 600 .env

# Secure database
chmod 600 prod.db
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs tsunami-dashboard --err

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart tsunami-dashboard

# If still issues, rebuild
npm run build
pm2 restart tsunami-dashboard
```

### nginx Issues

```bash
# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check nginx SSL config
sudo nano /etc/nginx/sites-available/tsunami-dashboard
```

### Database Locked

```bash
# Stop application
pm2 stop tsunami-dashboard

# Check for database locks
cd /var/www/Tsunami-Unleashed/distribution-dashboard
rm -f prod.db-shm prod.db-wal

# Restart application
pm2 start tsunami-dashboard
```

### Out of Memory

```bash
# Check memory
free -h

# Restart PM2 processes
pm2 restart all

# If persistent, upgrade server plan
```

---

## Cost Breakdown

**Monthly Costs:**
- **Hetzner CX21**: €5.83/month (~$6.30/month)
- **Domain**: $10-15/year (~$1/month)
- **SSL Certificate**: Free (Let's Encrypt)

**Total**: ~$7-8/month

**One-time Setup:**
- ~1 hour of setup time

---

## Quick Reference Commands

```bash
# Application management
pm2 start tsunami-dashboard
pm2 stop tsunami-dashboard
pm2 restart tsunami-dashboard
pm2 logs tsunami-dashboard

# nginx management
sudo systemctl restart nginx
sudo nginx -t

# Update application
cd /var/www/Tsunami-Unleashed/distribution-dashboard
git pull && npm install && npm run build && pm2 restart tsunami-dashboard

# Backup database
cp prod.db prod.db.backup-$(date +%Y%m%d)

# View logs
pm2 logs tsunami-dashboard
sudo tail -f /var/log/nginx/access.log
```

---

## Next Steps

1. ✅ Set up Pabbly Connect webhooks
2. ✅ Configure webhook URLs in Settings page
3. ✅ Test with real content
4. ✅ Monitor daily (see USER_GUIDE.md)
5. ✅ Set up email alerts (optional)

---

**🌊 Tsunami Unleashed | Distribution Dashboard | Deployed on Hetzner**
