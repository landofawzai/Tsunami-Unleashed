# Deployment Status

## Production Deployment - Hetzner VPS

**Status**: Successfully Deployed
**Date**: February 17, 2026
**Server**: Hetzner VPS (computergecko)
**IP Address**: 5.78.183.112
**Dashboard URL**: http://5.78.183.112:3080

---

## Deployment Details

### Server Specifications
- **Provider**: Hetzner Cloud
- **OS**: Ubuntu 24.04 LTS (Noble)
- **Node.js**: v22.22.0
- **PM2**: Latest (Global)
- **nginx**: 1.24.0
- **Location**: /var/www/Tsunami-Unleashed/repurposing-dashboard

### Environment Configuration

```env
DATABASE_URL="file:./prod.db"
API_KEY="1dd28151385170d2740506511d072441ec0c6a12ae13cc4caa1ca6ae76e92a1b"
NODE_ENV="production"

# AI & Processing (configure with real keys when ready)
ANTHROPIC_API_KEY=""
ELEVENLABS_API_KEY=""
FAL_API_KEY=""

# Google Drive (configure with real credentials when ready)
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=""
GOOGLE_DRIVE_PRIVATE_KEY=""
GOOGLE_DRIVE_FOLDER_ID=""

# Pabbly Webhooks (configure with real URLs when ready)
PABBLY_WEBHOOK_DERIVATIVE_CREATED=""
PABBLY_WEBHOOK_TRANSLATION_READY=""

# Distribution Dashboard integration (same server)
DISTRIBUTION_WEBHOOK_URL="http://localhost:3000/api/webhooks/content-posted"
DISTRIBUTION_API_KEY="e6adff367e6c06b045b9934e3be6b4f92cd39e281728a21cff6e49a0e0bf29b7"
```

**IMPORTANT**: The API key above is for Pabbly Connect webhook authentication. Store securely.

### Database Status
- **Type**: SQLite (prod.db)
- **Status**: Initialized and seeded
- **Location**: /var/www/Tsunami-Unleashed/repurposing-dashboard/prod.db
- **Seed Data**:
  - 3 source content items (1 sermon video, 1 teaching audio, 1 article)
  - 9 derivatives across 5 types
  - 9 translations (Hindi, Bengali, Maithili)
  - 8 derivative templates (one per type)
  - 5 processing jobs
  - 3 language configurations

### Application Status
- **Process Manager**: PM2
- **Process Name**: tsunami-repurposing
- **Internal Port**: 3002
- **nginx Port**: 3080
- **Auto-restart**: Enabled
- **Boot on server restart**: Enabled (systemd)
- **Status**: Running

### Web Server Configuration
- **Reverse Proxy**: nginx
- **External Port**: 3080 (HTTP)
- **Internal Port**: 3002 (Next.js)
- **SSL**: Not yet configured (requires domain)
- **Configuration**: /etc/nginx/sites-available/tsunami-repurposing
- **Status**: Active

---

## All Dashboards on this Server

| Pillar | Dashboard | Port | nginx Port | PM2 Name | URL |
|--------|-----------|------|------------|----------|-----|
| 3 | Distribution | 3000 | 80 | tsunami-dashboard | http://5.78.183.112 |
| 2 | Repurposing | 3002 | 3080 | tsunami-repurposing | http://5.78.183.112:3080 |

---

## Webhook Endpoints

All webhook endpoints are accessible at: `http://5.78.183.112:3080/api/webhooks/`

### Source Content Webhook (from Pabbly)
```
POST http://5.78.183.112:3080/api/webhooks/source-content
Headers:
  Content-Type: application/json
  x-api-key: 1dd28151385170d2740506511d072441ec0c6a12ae13cc4caa1ca6ae76e92a1b
```

### Job Complete Webhook
```
POST http://5.78.183.112:3080/api/webhooks/job-complete
Headers:
  Content-Type: application/json
  x-api-key: 1dd28151385170d2740506511d072441ec0c6a12ae13cc4caa1ca6ae76e92a1b
```

### Translation Reviewed Webhook
```
POST http://5.78.183.112:3080/api/webhooks/translation-reviewed
Headers:
  Content-Type: application/json
  x-api-key: 1dd28151385170d2740506511d072441ec0c6a12ae13cc4caa1ca6ae76e92a1b
```

---

## Deployment Process Summary

1. **Repository** cloned to /var/www/Tsunami-Unleashed
2. **Dependencies** installed (npm install)
3. **Environment** configured (.env with production settings)
4. **Database** initialized (prisma generate + db push + seed)
5. **Application** built (npm run build - clean)
6. **PM2** started on port 3002 as "tsunami-repurposing"
7. **nginx** reverse proxy configured on port 3080
8. **Verified**: Dashboard accessible, API responding, seed data present

---

## Next Steps

### 1. Configure AI Processing Keys
Add real API keys to `.env` on the server:
```bash
ssh root@5.78.183.112
nano /var/www/Tsunami-Unleashed/repurposing-dashboard/.env
# Add: ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, FAL_API_KEY
pm2 restart tsunami-repurposing
```

### 2. Configure Google Drive Integration
Add service account credentials for inter-pillar file exchange.

### 3. Configure Pabbly Webhooks
Set up Pabbly workflows:
- `ROUTE-SourceContent-to-Repurposing` → POST to source-content webhook
- `ROUTE-Derivatives-to-Distribution` → outbound to Distribution Dashboard
- `INTERNAL-Repurposing-ProcessQueue` → every 5 min hits /api/jobs/process-next

### 4. SSL Certificate (when domain is ready)
```bash
sudo certbot --nginx -d repurposing.yourdomain.com
```

---

## Useful Commands

### PM2 Management
```bash
pm2 status                       # Check all processes
pm2 logs tsunami-repurposing     # View logs
pm2 restart tsunami-repurposing  # Restart app
pm2 stop tsunami-repurposing     # Stop app
pm2 monit                        # Real-time monitoring
```

### nginx Management
```bash
sudo systemctl status nginx      # Check status
sudo systemctl restart nginx     # Restart nginx
sudo nginx -t                    # Test configuration
```

### Application Updates
```bash
cd /var/www/Tsunami-Unleashed
git pull origin master
cd repurposing-dashboard
npm install
npm run build
pm2 restart tsunami-repurposing
```

---

Deployed by: Claude Code
Last Updated: February 17, 2026
