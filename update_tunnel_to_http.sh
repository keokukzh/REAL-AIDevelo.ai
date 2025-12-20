#!/bin/bash
# Update Cloudflare Tunnel to use HTTP forwarding instead of TCP
# This properly handles WebSocket upgrades
# Run this on the Hetzner server via SSH

set -e

echo "=== Updating Cloudflare Tunnel to HTTP Forwarding ==="
echo ""

# Check if config file exists
CONFIG_FILE="/etc/cloudflared/config.yml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

echo "Current config:"
cat "$CONFIG_FILE"
echo ""

# Backup original config
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"
echo ""

# Get tunnel ID from config
TUNNEL_ID=$(grep -E "^tunnel:" "$CONFIG_FILE" | awk '{print $2}' | head -1)

if [ -z "$TUNNEL_ID" ]; then
    echo "❌ Could not find tunnel ID in config"
    exit 1
fi

echo "Tunnel ID: $TUNNEL_ID"
echo ""

# Create new config with HTTP forwarding (properly handles WebSocket upgrades)
cat > "$CONFIG_FILE" <<EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    service: http://localhost:8082
  - service: http_status:404
EOF

echo "✅ New config written:"
cat "$CONFIG_FILE"
echo ""

# Restart Cloudflare Tunnel
echo "Restarting Cloudflare Tunnel..."
systemctl restart cloudflared
sleep 3

# Check status
if systemctl is-active --quiet cloudflared; then
    echo "✅ Cloudflare Tunnel restarted successfully"
    systemctl status cloudflared --no-pager | head -10
else
    echo "❌ Cloudflare Tunnel failed to start"
    journalctl -u cloudflared -n 20 --no-pager
    exit 1
fi

echo ""
echo "=== Update Complete ==="
echo "Tunnel now forwards to http://localhost:8082 (Nginx)"
echo "Nginx will handle WebSocket upgrades and proxy to FreeSWITCH WSS"
echo ""

