#!/bin/bash
# ============================================================
# Deploy Master Dashboard to Hetzner VPS
# Tsunami Unleashed — Command Center (port 3004 / nginx 3083)
# ============================================================
set -e

APP_DIR="/var/www/master-dashboard"
PM2_NAME="tsunami-master"
APP_PORT=3004
NGINX_PORT=3083
REPO_URL="https://github.com/landofawzai/Tsunami-Unleashed.git"

echo "=== Deploying Master Dashboard ==="
echo "App Port: $APP_PORT | nginx Port: $NGINX_PORT | PM2: $PM2_NAME"
echo ""

# ---- 1. Clone or pull latest code ----
if [ -d "$APP_DIR" ]; then
  echo "[1/5] Pulling latest code..."
  cd "$APP_DIR"
  git pull
else
  echo "[1/5] Cloning repository..."
  git clone "$REPO_URL" /tmp/tsunami-clone
  mkdir -p "$APP_DIR"
  cp -r /tmp/tsunami-clone/master-dashboard/* "$APP_DIR/"
  cp -r /tmp/tsunami-clone/master-dashboard/.* "$APP_DIR/" 2>/dev/null || true
  rm -rf /tmp/tsunami-clone
  cd "$APP_DIR"
fi

# ---- 2. Install dependencies ----
echo "[2/5] Installing dependencies..."
npm install

# ---- 3. Create .env (pillar URLs are localhost on same server) ----
echo "[3/5] Configuring environment..."
cat > .env << 'ENVEOF'
# Master Dashboard — Pillar Internal URLs
# All pillars run on the same Hetzner VPS at localhost
PILLAR_CREATION_URL=http://localhost:3003
PILLAR_REPURPOSING_URL=http://localhost:3002
PILLAR_DISTRIBUTION_URL=http://localhost:3000
PILLAR_COMMUNICATION_URL=http://localhost:3001
# Reserved for future pillars:
# PILLAR_ADMIN_URL=http://localhost:3005
# PILLAR_DISCIPLING_URL=http://localhost:3006
ENVEOF
echo "  .env created"

# ---- 4. Build ----
echo "[4/5] Building Next.js..."
npm run build

# ---- 5. PM2 setup ----
echo "[5/5] Setting up PM2..."
pm2 delete "$PM2_NAME" 2>/dev/null || true
pm2 start npm --name "$PM2_NAME" -- start -- --port "$APP_PORT"
pm2 save

echo ""
echo "=== Verifying deployment ==="
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$APP_PORT")
echo "  localhost:$APP_PORT → HTTP $HTTP_CODE"

# ---- nginx config ----
NGINX_CONF="/etc/nginx/sites-available/tsunami-master"
if [ ! -f "$NGINX_CONF" ]; then
  echo ""
  echo "=== Creating nginx config ==="
  cat > "$NGINX_CONF" << NGINXEOF
server {
    listen $NGINX_PORT;
    server_name _;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  echo "  nginx configured on port $NGINX_PORT"
fi

# Verify nginx
sleep 1
NGINX_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$NGINX_PORT")
echo "  localhost:$NGINX_PORT → HTTP $NGINX_CODE"

echo ""
echo "=== Deployment complete ==="
echo "  Dashboard: http://5.78.183.112:$NGINX_PORT"
echo "  PM2 name:  $PM2_NAME"
echo "  App port:  $APP_PORT"
echo "  nginx:     $NGINX_PORT"
echo ""
echo "=== All Tsunami Dashboards ==="
echo "  P1 Content Creation:  http://5.78.183.112:3082"
echo "  P2 Repurposing:       http://5.78.183.112:3080"
echo "  P3 Distribution:      http://5.78.183.112"
echo "  P4 Communication:     http://5.78.183.112:3081"
echo "  Master Command Center: http://5.78.183.112:$NGINX_PORT"
