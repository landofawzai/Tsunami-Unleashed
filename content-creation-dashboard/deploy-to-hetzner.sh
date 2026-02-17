#!/bin/bash

# Tsunami Unleashed - Content Creation Dashboard Deployment
# Run this script on your Hetzner server after SSH'ing in
# Assumes Distribution, Repurposing, and Communication Dashboards are already deployed

set -e

echo "Content Creation Dashboard - Hetzner Deployment"
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
cd content-creation-dashboard
npm install

echo -e "${YELLOW}Step 3: Configuring environment variables...${NC}"

# Generate API key
API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Generated API Key: $API_KEY"

cat > .env << EOF
DATABASE_URL="file:./prod.db"
API_KEY="$API_KEY"
NODE_ENV="production"

# Pabbly Webhooks
PABBLY_WEBHOOK_TO_REPURPOSING=""

# Integration with other pillars
REPURPOSING_DASHBOARD_URL="http://localhost:3002"
DISTRIBUTION_DASHBOARD_URL="http://localhost:3000"
EOF

echo -e "${GREEN}.env file created${NC}"

echo -e "${GREEN}Step 4: Initializing database...${NC}"
npx prisma generate
npx prisma db push
node prisma/seed.js

echo -e "${GREEN}Step 5: Building application...${NC}"
npm run build

echo -e "${GREEN}Step 6: Starting application with PM2 on port 3003...${NC}"
pm2 stop tsunami-creation 2>/dev/null || true
pm2 delete tsunami-creation 2>/dev/null || true
pm2 start npm --name "tsunami-creation" -- start
pm2 save

echo -e "${GREEN}Step 7: Configuring nginx on port 3082...${NC}"

# Add port-based proxy
cat > /etc/nginx/sites-available/tsunami-creation << 'NGINX_CONFIG'
server {
    listen 3082;
    server_name _;

    location / {
        proxy_pass http://localhost:3003;
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
        proxy_pass http://localhost:3003;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

ln -sf /etc/nginx/sites-available/tsunami-creation /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo ""
echo -e "${GREEN}Deployment Complete!${NC}"
echo ""
echo "=========================================================="
echo "Content Creation Dashboard (Pillar 1)"
echo "=========================================================="
echo ""
echo "API Key: $API_KEY"
echo "Port: 3003"
echo "nginx: 3082"
echo "PM2 Name: tsunami-creation"
echo ""
echo "Access: http://YOUR_SERVER_IP:3082"
echo ""
echo "Useful Commands:"
echo "  pm2 logs tsunami-creation"
echo "  pm2 restart tsunami-creation"
echo "  pm2 status"
echo ""
