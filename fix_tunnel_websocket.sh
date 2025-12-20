#!/bin/bash
# Fix Cloudflare Tunnel configuration for WebSocket support
# Run this on the Hetzner server via SSH

set -e

echo "=== Fixing Cloudflare Tunnel for WebSocket Support ==="
echo ""

# Check if config file exists
CONFIG_FILE="$HOME/.cloudflared/config.yml"

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

# Create new config with proper WebSocket support
cat > "$CONFIG_FILE" <<EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    originRequest:
      noHappyEyeballs: false
      tcpKeepAlive: 30s
      keepAliveConnections: 100
      keepAliveTimeout: 90s
      connectTimeout: 30s
    service: tcp://localhost:7443
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
echo "=== Next Steps ==="
echo "1. Wait 30 seconds for tunnel to fully restart"
echo "2. Test connection at: https://aidevelo.ai/dashboard/test-call"
echo "3. Check tunnel logs: journalctl -u cloudflared -f"
echo ""

