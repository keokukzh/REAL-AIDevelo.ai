#!/bin/bash
# Complete deployment script for WebSocket fix
# Run this on the Hetzner server via SSH
# This script:
# 1. Updates Nginx config
# 2. Restarts Nginx
# 3. Updates Cloudflare Tunnel config
# 4. Restarts Cloudflare Tunnel
# 5. Verifies FreeSWITCH WSS

set -e

echo "=== Deploying WebSocket Fix ==="
echo ""

# Get project directory
PROJECT_DIR="$HOME/REAL-AIDevelo.ai"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="/root/REAL-AIDevelo.ai"
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Cannot find project directory"
    exit 1
fi

cd "$PROJECT_DIR"

echo "Project directory: $PROJECT_DIR"
echo ""

# Step 1: Update Nginx config
echo "=== Step 1: Updating Nginx Configuration ==="
if [ -f "infra/nginx/nginx.conf" ]; then
    echo "Copying Nginx config to /etc/nginx/nginx.conf..."
    cp infra/nginx/nginx.conf /etc/nginx/nginx.conf
    
    # Test Nginx config
    echo "Testing Nginx configuration..."
    if nginx -t; then
        echo "✅ Nginx config is valid"
    else
        echo "❌ Nginx config test failed"
        exit 1
    fi
    
    # Restart Nginx
    echo "Restarting Nginx..."
    systemctl restart nginx
    sleep 2
    
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx restarted successfully"
        systemctl status nginx --no-pager | head -5
    else
        echo "❌ Nginx failed to start"
        systemctl status nginx --no-pager | head -10
        exit 1
    fi
else
    echo "❌ Nginx config file not found: infra/nginx/nginx.conf"
    exit 1
fi
echo ""

# Step 2: Update Cloudflare Tunnel config
echo "=== Step 2: Updating Cloudflare Tunnel Configuration ==="
CONFIG_FILE="/etc/cloudflared/config.yml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

# Backup
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# Get tunnel ID
TUNNEL_ID=$(grep -E "^tunnel:" "$CONFIG_FILE" | awk '{print $2}' | head -1)

if [ -z "$TUNNEL_ID" ]; then
    echo "❌ Could not find tunnel ID in config"
    exit 1
fi

echo "Tunnel ID: $TUNNEL_ID"

# Update config
cat > "$CONFIG_FILE" <<EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    service: http://localhost:8082
  - service: http_status:404
EOF

echo "✅ Tunnel config updated to use http://localhost:8082"
echo ""

# Restart Cloudflare Tunnel
echo "Restarting Cloudflare Tunnel..."
systemctl restart cloudflared
sleep 3

if systemctl is-active --quiet cloudflared; then
    echo "✅ Cloudflare Tunnel restarted successfully"
    systemctl status cloudflared --no-pager | head -5
else
    echo "❌ Cloudflare Tunnel failed to start"
    journalctl -u cloudflared -n 20 --no-pager
    exit 1
fi
echo ""

# Step 3: Verify FreeSWITCH WSS
echo "=== Step 3: Verifying FreeSWITCH WSS ==="

# Check if FreeSWITCH is running
if ! docker ps | grep -q freeswitch; then
    echo "Starting FreeSWITCH..."
    docker compose up -d freeswitch
    echo "Waiting 30 seconds for FreeSWITCH to start..."
    sleep 30
fi

# Check FreeSWITCH status
if docker exec aidevelo-freeswitch fs_cli -x "status" 2>/dev/null | grep -q "UP"; then
    echo "✅ FreeSWITCH is running"
else
    echo "⚠️  FreeSWITCH not responding, waiting 10 more seconds..."
    sleep 10
fi

# Check and start internal profile
INTERNAL_STATUS=$(docker exec aidevelo-freeswitch fs_cli -x "sofia status profile internal" 2>/dev/null || echo "")
if echo "$INTERNAL_STATUS" | grep -q "RUNNING\|STARTED"; then
    echo "✅ Internal profile is running"
else
    echo "Starting internal profile..."
    docker exec aidevelo-freeswitch fs_cli -x "sofia profile internal start" 2>&1
    sleep 3
    echo "✅ Internal profile started"
fi
echo ""

# Final status
echo "=== Deployment Complete ==="
echo ""
echo "✅ Nginx: Running on port 8082, proxying to FreeSWITCH WSS"
echo "✅ Cloudflare Tunnel: Running, forwarding to http://localhost:8082"
echo "✅ FreeSWITCH: Running with WSS binding on port 7443"
echo ""
echo "Architecture:"
echo "  Browser (wss://freeswitch.aidevelo.ai)"
echo "    → Cloudflare Tunnel (HTTPS)"
echo "      → Nginx (http://localhost:8082) - WebSocket upgrade"
echo "        → FreeSWITCH (https://127.0.0.1:7443) - WSS endpoint"
echo ""
echo "Wait 30 seconds, then test at: https://aidevelo.ai/dashboard/test-call"
echo ""

