#!/bin/bash

# Tsunami Unleashed - Hetzner Deployment Script
# Run this script on your Hetzner server after SSH'ing in

set -e  # Exit on any error

echo "🌊 Tsunami Unleashed - Distribution Dashboard Deployment"
echo "=========================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Step 2: Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo -e "${GREEN}Step 3: Installing PM2, nginx, certbot...${NC}"
npm install -g pm2
apt install -y nginx certbot python3-certbot-nginx

echo -e "${GREEN}Step 4: Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

echo -e "${GREEN}Step 5: Creating deployment directory...${NC}"
mkdir -p /var/www
cd /var/www

echo -e "${GREEN}Step 6: Cloning repository...${NC}"
if [ -d "Tsunami-Unleashed" ]; then
    echo "Repository already exists, pulling latest changes..."
    cd Tsunami-Unleashed
    git pull origin master
else
    git clone https://github.com/landofawzai/Tsunami-Unleashed.git
    cd Tsunami-Unleashed
fi

cd distribution-dashboard

echo -e "${GREEN}Step 7: Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Step 8: Configuring environment variables...${NC}"
echo "Please provide the following information:"
echo ""

# Generate API key
API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Generated API Key: $API_KEY"
echo ""

read -p "Enter your domain name (e.g., dashboard.yourdomain.com): " DOMAIN
read -p "Use generated API key? (Y/n): " USE_GENERATED_KEY

if [[ $USE_GENERATED_KEY =~ ^[Nn]$ ]]; then
    read -p "Enter your custom API key: " API_KEY
fi

# Create .env file
cat > .env << EOF
DATABASE_URL="file:./prod.db"
API_KEY="$API_KEY"
NEXT_PUBLIC_BASE_URL="https://$DOMAIN"
NODE_ENV="production"
EOF

echo -e "${GREEN}.env file created${NC}"

echo -e "${GREEN}Step 9: Initializing database...${NC}"
npm run db:push
npm run db:seed

echo -e "${GREEN}Step 10: Building application...${NC}"
npm run build

echo -e "${GREEN}Step 11: Starting application with PM2...${NC}"
pm2 stop tsunami-dashboard 2>/dev/null || true
pm2 delete tsunami-dashboard 2>/dev/null || true
pm2 start npm --name "tsunami-dashboard" -- start
pm2 save

# Set PM2 to start on boot
pm2 startup systemd -u root --hp /root
# The command above will output another command - we'll run it
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

echo -e "${GREEN}Step 12: Configuring nginx...${NC}"
cat > /etc/nginx/sites-available/tsunami-dashboard << 'NGINX_CONFIG'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

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

    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/tsunami-dashboard

# Enable site
ln -sf /etc/nginx/sites-available/tsunami-dashboard /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "=========================================================="
echo "📝 Important Information:"
echo "=========================================================="
echo ""
echo "🔑 API Key: $API_KEY"
echo "   (Save this securely - you'll need it for Pabbly Connect)"
echo ""
echo "🌐 Your dashboard is running at: http://$DOMAIN"
echo ""
echo "🔒 Next Step: Set up SSL Certificate"
echo "   Run this command:"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "=========================================================="
echo "📊 Useful Commands:"
echo "=========================================================="
echo ""
echo "View logs:        pm2 logs tsunami-dashboard"
echo "Restart app:      pm2 restart tsunami-dashboard"
echo "Check status:     pm2 status"
echo "nginx logs:       tail -f /var/log/nginx/error.log"
echo ""
echo "🌊 Tsunami Unleashed is now deployed!"
echo ""
