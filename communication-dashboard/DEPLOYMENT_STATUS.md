# Deployment Status

## Production Deployment - Hetzner VPS

**Status**: Successfully Deployed
**Date**: February 17, 2026
**Server**: Hetzner VPS (computergecko)
**IP Address**: 5.78.183.112
**Dashboard URL**: http://5.78.183.112:3081

---

## Deployment Details

### Server Specifications
- **Provider**: Hetzner Cloud
- **OS**: Ubuntu 24.04 LTS (Noble)
- **Node.js**: v22.22.0
- **PM2**: Latest (Global)
- **nginx**: 1.24.0
- **Location**: /var/www/Tsunami-Unleashed/communication-dashboard

### Environment Configuration

```env
DATABASE_URL="file:./prod.db"
API_KEY="7cf70c7a2972c1aa43ae919346b6798a9fcdd31da67d3f49405f85fe00ea15df"
NODE_ENV="production"

# Anthropic API Key for AI channel adaptation and translation
ANTHROPIC_API_KEY=""

# Pabbly Connect Outbound Webhook URLs (configure per channel)
PABBLY_WEBHOOK_EMAIL=""
PABBLY_WEBHOOK_WHATSAPP=""
PABBLY_WEBHOOK_TELEGRAM=""
PABBLY_WEBHOOK_SIGNAL=""
PABBLY_WEBHOOK_SMS=""
PABBLY_WEBHOOK_SOCIAL=""
```

**IMPORTANT**: The API key above is for Pabbly Connect webhook authentication. Store securely.

### Database Status
- **Type**: SQLite (prod.db)
- **Status**: Initialized and seeded
- **Location**: /var/www/Tsunami-Unleashed/communication-dashboard/prod.db
- **Seed Data**:
  - 5 audience segments
  - 41 contacts with 43 segment assignments
  - 3 campaigns with 5 versions
  - 2 broadcasts
  - 1 sequence (5 steps, 3 enrollments)
  - 5 message templates
  - 2 alerts, 2 daily metrics

### Application Status
- **Process Manager**: PM2
- **Process Name**: tsunami-communication
- **Internal Port**: 3001
- **nginx Port**: 3081
- **Auto-restart**: Enabled
- **Boot on server restart**: Enabled (systemd)
- **Status**: Running

### Web Server Configuration
- **Reverse Proxy**: nginx
- **External Port**: 3081 (HTTP)
- **Internal Port**: 3001 (Next.js)
- **SSL**: Not yet configured (requires domain)
- **Configuration**: /etc/nginx/sites-available/tsunami-communication
- **Status**: Active

---

## All Dashboards on this Server

| Pillar | Dashboard | Internal Port | nginx Port | PM2 Name | URL |
|--------|-----------|---------------|------------|----------|-----|
| 3 | Distribution | 3000 | 80 | tsunami-dashboard | http://5.78.183.112 |
| 2 | Repurposing | 3002 | 3080 | tsunami-repurposing | http://5.78.183.112:3080 |
| 4 | Communication | 3001 | 3081 | tsunami-communication | http://5.78.183.112:3081 |

---

## Webhook Endpoints

All webhook endpoints are accessible at: `http://5.78.183.112:3081/api/webhooks/`

### Campaign from Drive Webhook (from Pabbly)
```
POST http://5.78.183.112:3081/api/webhooks/campaign-from-drive
Headers:
  Content-Type: application/json
  x-api-key: 7cf70c7a2972c1aa43ae919346b6798a9fcdd31da67d3f49405f85fe00ea15df
```

### Delivery Status Webhook
```
POST http://5.78.183.112:3081/api/webhooks/delivery-status
Headers:
  Content-Type: application/json
  x-api-key: 7cf70c7a2972c1aa43ae919346b6798a9fcdd31da67d3f49405f85fe00ea15df
```

### Sequence Trigger Webhook
```
POST http://5.78.183.112:3081/api/webhooks/sequence-trigger
Headers:
  Content-Type: application/json
  x-api-key: 7cf70c7a2972c1aa43ae919346b6798a9fcdd31da67d3f49405f85fe00ea15df
```

---

## Deployment Process Summary

1. **Repository** pulled latest from /var/www/Tsunami-Unleashed
2. **Dependencies** installed (npm install)
3. **Environment** configured (.env with production settings)
4. **Database** initialized (prisma generate + db push + seed)
5. **Application** built (npm run build - clean)
6. **PM2** started on port 3001 as "tsunami-communication"
7. **nginx** reverse proxy configured on port 3081
8. **Verified**: Dashboard accessible, API responding, seed data present

---

## Next Steps

### 1. Configure Anthropic API Key
Add real API key for AI channel adaptation and translation:
```bash
ssh root@5.78.183.112
nano /var/www/Tsunami-Unleashed/communication-dashboard/.env
# Add: ANTHROPIC_API_KEY="sk-ant-..."
pm2 restart tsunami-communication
```

### 2. Configure Pabbly Webhooks
Set up Pabbly workflows for each communication channel:
- `ROUTE-Content-to-Communication` → inbound campaign webhook
- `ROUTE-Communication-to-Email` → outbound email via Pabbly
- `ROUTE-Communication-to-WhatsApp` → outbound WhatsApp
- `ROUTE-Communication-to-Telegram` → outbound Telegram

### 3. SSL Certificate (when domain is ready)
```bash
sudo certbot --nginx -d communication.yourdomain.com
```

---

## Useful Commands

### PM2 Management
```bash
pm2 status                          # Check all processes
pm2 logs tsunami-communication      # View logs
pm2 restart tsunami-communication   # Restart app
pm2 stop tsunami-communication      # Stop app
pm2 monit                           # Real-time monitoring
```

### nginx Management
```bash
sudo systemctl status nginx         # Check status
sudo systemctl restart nginx        # Restart nginx
sudo nginx -t                       # Test configuration
```

### Application Updates
```bash
cd /var/www/Tsunami-Unleashed
git pull origin master
cd communication-dashboard
npm install
npm run build
pm2 restart tsunami-communication
```

---

Deployed by: Claude Code
Last Updated: February 17, 2026
