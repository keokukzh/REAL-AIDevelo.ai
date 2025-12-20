#!/bin/bash
# Fix Cloudflare Tunnel configuration for WebSocket support
# Run this on the Hetzner server

echo "=== Fixing Cloudflare Tunnel Configuration ==="
echo ""

# Check if config file exists
CONFIG_FILE="$HOME/.cloudflared/config.yml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    echo "Please create it first (see CLOUDFLARE_TUNNEL_SETUP.md)"
    exit 1
fi

echo "Current config:"
cat "$CONFIG_FILE"
echo ""

# Backup original config
cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
echo "✅ Backup created: $CONFIG_FILE.backup"
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

# WebSocket support requires originRequest configuration
ingress:
  - hostname: freeswitch.aidevelo.ai
    originRequest:
      noHappyEyeballs: false
      tcpKeepAlive: 30s
      keepAliveConnections: 100
      keepAliveTimeout: 90s
    service: tcp://localhost:7443
  - service: http_status:404
EOF

echo "✅ New config written:"
cat "$CONFIG_FILE"
echo ""

echo "=== Next Steps ==="
echo "1. Restart Cloudflare Tunnel:"
echo "   systemctl restart cloudflared"
echo ""
echo "2. Check status:"
echo "   systemctl status cloudflared"
echo ""
echo "3. Check logs:"
echo "   journalctl -u cloudflared -f"
echo ""

