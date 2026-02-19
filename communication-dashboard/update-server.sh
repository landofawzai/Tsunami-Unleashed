#!/bin/bash

# Tsunami Unleashed - Communication Dashboard Update
# Pulls latest code, rebuilds, and restarts. Does NOT touch .env or database.
# Usage: sudo bash update-server.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

DASHBOARD_DIR="/var/www/Tsunami-Unleashed/communication-dashboard"

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}[1/5] Pulling latest code...${NC}"
cd /var/www/Tsunami-Unleashed
git pull origin master

echo -e "${GREEN}[2/5] Installing dependencies...${NC}"
cd "$DASHBOARD_DIR"
npm install

echo -e "${GREEN}[3/5] Generating Prisma client...${NC}"
npx prisma generate

echo -e "${GREEN}[4/5] Building application...${NC}"
npm run build

echo -e "${GREEN}[5/5] Restarting PM2...${NC}"
pm2 restart tsunami-communication

echo ""
echo -e "${GREEN}Update complete!${NC}"
echo "Run 'pm2 logs tsunami-communication' to verify."
