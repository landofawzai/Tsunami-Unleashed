#!/bin/bash

# Tsunami Unleashed - Repurposing Dashboard Deployment
# Run this script on your Hetzner server after SSH'ing in
# Assumes Distribution Dashboard is already deployed and running

set -e

echo "Content Repurposing Dashboard - Hetzner Deployment"
echo "=========================================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Pulling latest code...${NC}"
cd /var/www/Tsunami-Unleashed
git pull origin master

echo -e "${GREEN}Step 2: Installing dependencies...${NC}"
cd repurposing-dashboard
npm install

echo -e "${YELLOW}Step 3: Configuring environment variables...${NC}"

# Generate API key
API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Generated API Key: $API_KEY"

cat > .env << EOF
DATABASE_URL="file:./prod.db"
API_KEY="$API_KEY"
NODE_ENV="production"

# AI & Processing (configure with real keys)
ANTHROPIC_API_KEY=""
ELEVENLABS_API_KEY=""
FAL_API_KEY=""

# Google Drive (configure with real credentials)
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=""
GOOGLE_DRIVE_PRIVATE_KEY=""
GOOGLE_DRIVE_FOLDER_ID=""

# Pabbly Webhooks (configure with real URLs)
PABBLY_WEBHOOK_DERIVATIVE_CREATED=""
PABBLY_WEBHOOK_TRANSLATION_READY=""

# Distribution Dashboard integration
DISTRIBUTION_WEBHOOK_URL="http://localhost:3000/api/webhooks/content-posted"
DISTRIBUTION_API_KEY=""
EOF

echo -e "${GREEN}.env file created${NC}"

echo -e "${GREEN}Step 4: Initializing database...${NC}"
npx prisma generate
npx prisma db push
node prisma/seed.js

echo -e "${GREEN}Step 5: Building application...${NC}"
npm run build

echo -e "${GREEN}Step 6: Starting application with PM2 on port 3002...${NC}"
pm2 stop tsunami-repurposing 2>/dev/null || true
pm2 delete tsunami-repurposing 2>/dev/null || true
pm2 start npm --name "tsunami-repurposing" -- start
pm2 save

echo -e "${GREEN}Step 7: Configuring nginx...${NC}"
cat > /etc/nginx/sites-available/tsunami-repurposing << 'NGINX_CONFIG'
server {
    listen 80;
    server_name repurposing.DOMAIN_PLACEHOLDER;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static/ {
        proxy_pass http://localhost:3002;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

ln -sf /etc/nginx/sites-available/tsunami-repurposing /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo ""
echo -e "${GREEN}Deployment Complete!${NC}"
echo ""
echo "=========================================================="
echo "Repurposing Dashboard (Pillar 2)"
echo "=========================================================="
echo ""
echo "API Key: $API_KEY"
echo "Port: 3002"
echo "PM2 Name: tsunami-repurposing"
echo ""
echo "Useful Commands:"
echo "  pm2 logs tsunami-repurposing"
echo "  pm2 restart tsunami-repurposing"
echo "  pm2 status"
echo ""
