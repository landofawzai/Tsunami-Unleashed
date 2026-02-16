# Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Management](#database-management)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: For version control
- **SQLite**: Included with Prisma (no separate installation)

### Recommended Tools

- **Prisma Studio**: Database GUI (included in project)
- **PM2**: Process manager for production
- **nginx**: Reverse proxy for production
- **Let's Encrypt**: Free SSL certificates

---

## Local Development

### 1. Clone Repository

```bash
git clone https://github.com/landofawzai/Tsunami-Unleashed.git
cd Tsunami-Unleashed/distribution-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL="file:./dev.db"

# API Authentication
API_KEY="your-secure-api-key-change-in-production"

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 4. Initialize Database

```bash
# Push schema to database
npm run db:push

# Seed with initial data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Dashboard available at: `http://localhost:3000`

### 6. Verify Installation

1. Open browser to `http://localhost:3000`
2. Verify dashboard loads
3. Check Tier 1 capacity widget shows 150 total slots
4. Go to Settings page, verify webhook URLs
5. Test webhook (see API_DOCUMENTATION.md)

---

## Production Deployment

### Option 1: Vercel (Recommended for Next.js)

Vercel is the platform created by Next.js makers and offers seamless deployment.

#### Step 1: Prepare Repository

```bash
# Ensure latest code is pushed
git add .
git commit -m "feat: prepare for production deployment"
git push origin master
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import `Tsunami-Unleashed` repository
5. Configure:
   - **Root Directory**: `distribution-dashboard`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Step 3: Add Environment Variables

In Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add:
   ```
   DATABASE_URL=file:./prod.db
   API_KEY=<generate-secure-key>
   NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
   ```

#### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Visit deployment URL
4. Verify dashboard loads

**Note**: SQLite works on Vercel but has limitations. For production with multiple instances, consider PostgreSQL.

---

### Option 2: VPS (DigitalOcean, Linode, AWS EC2)

For full control and SQLite persistence.

#### Step 1: Provision Server

- **OS**: Ubuntu 22.04 LTS
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB minimum
- **Firewall**: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

#### Step 2: Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install nginx
apt install -y nginx

# Install certbot (for SSL)
apt install -y certbot python3-certbot-nginx
```

#### Step 3: Deploy Application

```bash
# Create app directory
mkdir -p /var/www/tsunami-dashboard
cd /var/www/tsunami-dashboard

# Clone repository
git clone https://github.com/landofawzai/Tsunami-Unleashed.git .
cd distribution-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env
```

Edit `.env`:

```env
DATABASE_URL="file:./prod.db"
API_KEY="<generate-strong-key>"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NODE_ENV="production"
```

```bash
# Initialize database
npm run db:push
npm run db:seed

# Build for production
npm run build

# Start with PM2
pm2 start npm --name "tsunami-dashboard" -- start
pm2 save
pm2 startup
```

#### Step 4: Configure nginx

```bash
nano /etc/nginx/sites-available/tsunami-dashboard
```

Add configuration:

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
}
```

Enable site:

```bash
ln -s /etc/nginx/sites-available/tsunami-dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 5: SSL Certificate

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts:
- Enter email
- Agree to terms
- Choose redirect HTTP to HTTPS: Yes

Test auto-renewal:

```bash
certbot renew --dry-run
```

---

### Option 3: Docker

#### Dockerfile

Create `distribution-dashboard/Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  dashboard:
    build: ./distribution-dashboard
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./prod.db
      - API_KEY=${API_KEY}
      - NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

#### Deploy

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Environment Configuration

### Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | SQLite database path | `file:./prod.db` | Yes |
| `API_KEY` | Webhook authentication | `<secure-random-string>` | Yes |
| `NEXT_PUBLIC_BASE_URL` | Public dashboard URL | `https://dashboard.com` | Yes |
| `NODE_ENV` | Environment mode | `production` | No (auto-set) |

### Generating Secure API Key

```bash
# Linux/Mac
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Online
# Use: https://www.random.org/strings/
```

### Security Best Practices

1. **Never commit `.env` to git**
2. **Use different API keys** for dev/staging/production
3. **Rotate API keys quarterly**
4. **Use HTTPS only** in production
5. **Set restrictive file permissions**:
   ```bash
   chmod 600 .env
   chmod 600 prod.db
   ```

---

## Database Management

### Backup Database

```bash
# Create backup
cp prod.db prod.db.backup-$(date +%Y%m%d)

# Automated daily backup (crontab)
0 2 * * * cp /var/www/tsunami-dashboard/distribution-dashboard/prod.db /backups/prod.db.$(date +\%Y\%m\%d)
```

### Restore Database

```bash
# Stop application
pm2 stop tsunami-dashboard

# Restore from backup
cp prod.db.backup-20240215 prod.db

# Restart application
pm2 start tsunami-dashboard
```

### Migrate Database (Schema Changes)

```bash
# After updating prisma/schema.prisma
npm run db:push

# Or with migrations (recommended for production)
npx prisma migrate deploy
```

### View Database

```bash
# Open Prisma Studio
npm run db:studio

# Access at http://localhost:5555
```

### Reset Database (DANGER - Deletes All Data)

```bash
# Development only
rm dev.db
npm run db:push
npm run db:seed
```

---

## SSL/HTTPS Setup

### Let's Encrypt (Free)

Automatic renewal configured during initial setup:

```bash
# Test renewal
certbot renew --dry-run

# Manual renewal (if needed)
certbot renew

# View certificate info
certbot certificates
```

### Custom SSL Certificate

If using purchased certificate:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # ... rest of config
}
```

---

## Monitoring & Maintenance

### Application Monitoring

#### PM2 Status

```bash
# View running processes
pm2 list

# View logs
pm2 logs tsunami-dashboard

# View detailed info
pm2 info tsunami-dashboard

# Monitor resources
pm2 monit
```

#### Application Health Check

Create `/health-check.sh`:

```bash
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/dashboard/stats)
if [ $RESPONSE -ne 200 ]; then
    echo "Dashboard is down! Response code: $RESPONSE"
    pm2 restart tsunami-dashboard
fi
```

Schedule with cron:

```bash
*/5 * * * * /var/www/tsunami-dashboard/health-check.sh
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory
free -h

# Check nginx status
systemctl status nginx

# Check nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Database Maintenance

```bash
# Vacuum database (optimize)
sqlite3 prod.db "VACUUM;"

# Check database size
du -h prod.db

# Analyze database
sqlite3 prod.db "ANALYZE;"
```

### Updates

```bash
# Pull latest code
cd /var/www/tsunami-dashboard/distribution-dashboard
git pull origin master

# Install new dependencies
npm install

# Run migrations
npm run db:push

# Rebuild application
npm run build

# Restart
pm2 restart tsunami-dashboard
```

---

## Troubleshooting

### Issue: Application Won't Start

**Check logs**:
```bash
pm2 logs tsunami-dashboard --lines 50
```

**Common causes**:
- Port 3000 already in use
- Missing environment variables
- Database file permissions
- Build errors

**Solutions**:
```bash
# Change port in .env
echo "PORT=3001" >> .env

# Verify env vars
cat .env

# Fix permissions
chmod 600 .env
chmod 600 prod.db
chown www-data:www-data prod.db

# Rebuild
npm run build
pm2 restart tsunami-dashboard
```

---

### Issue: 502 Bad Gateway

**Check nginx**:
```bash
nginx -t
systemctl status nginx
```

**Check application**:
```bash
pm2 list
curl http://localhost:3000
```

**Solutions**:
```bash
# Restart nginx
systemctl restart nginx

# Restart application
pm2 restart tsunami-dashboard

# Check nginx config
nano /etc/nginx/sites-available/tsunami-dashboard
```

---

### Issue: SSL Certificate Expired

**Renew certificate**:
```bash
certbot renew --force-renewal
systemctl restart nginx
```

**Check expiry**:
```bash
certbot certificates
```

---

### Issue: Database Locked

**Symptoms**: "database is locked" error

**Solutions**:
```bash
# Stop all connections
pm2 stop tsunami-dashboard

# Check for locks
fuser prod.db

# Remove lock file (if exists)
rm prod.db-shm
rm prod.db-wal

# Restart
pm2 start tsunami-dashboard
```

---

### Issue: High Memory Usage

**Check memory**:
```bash
free -h
pm2 monit
```

**Solutions**:
```bash
# Restart application
pm2 restart tsunami-dashboard

# Clear PM2 logs
pm2 flush

# Increase server RAM (if needed)
```

---

## Performance Optimization

### Enable Gzip Compression

Add to nginx config:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
gzip_min_length 1000;
```

### Enable Caching

```nginx
location /_next/static/ {
    alias /var/www/tsunami-dashboard/distribution-dashboard/.next/static/;
    expires 365d;
    access_log off;
}
```

### Optimize Database

```bash
# Regular vacuum
echo "0 3 * * * sqlite3 /var/www/tsunami-dashboard/distribution-dashboard/prod.db 'VACUUM;'" | crontab -
```

---

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Firewall configured (UFW or cloud provider)
- [ ] API key is strong and unique
- [ ] `.env` file has restrictive permissions (600)
- [ ] Database file has restrictive permissions (600)
- [ ] Regular backups scheduled
- [ ] Automatic security updates enabled
- [ ] nginx security headers configured
- [ ] SSH key authentication (disable password)
- [ ] Non-root user for application

---

## Support

For deployment issues:
1. Check application logs: `pm2 logs`
2. Check nginx logs: `/var/log/nginx/error.log`
3. Review deployment checklist above
4. Verify environment configuration
5. Test locally first: `npm run build && npm start`

---

**🌊 Tsunami Unleashed | Reaching 1 billion through automation**
