#!/bin/bash
# Verify FreeSWITCH and Cloudflare Tunnel setup on Hetzner server
# Run this on the server via SSH

echo "=== Server Setup Verification ==="
echo ""

# 1. Check FreeSWITCH
echo "1. Checking FreeSWITCH..."
if docker ps | grep -q freeswitch; then
    echo "✅ FreeSWITCH container is RUNNING"
    docker ps | grep freeswitch
else
    echo "❌ FreeSWITCH container is NOT running"
    echo "Starting FreeSWITCH..."
    cd ~/REAL-AIDevelo.ai 2>/dev/null || cd /root/REAL-AIDevelo.ai 2>/dev/null || { echo "❌ Cannot find project directory"; exit 1; }
    docker compose up -d freeswitch
    sleep 10
    if docker ps | grep -q freeswitch; then
        echo "✅ FreeSWITCH started"
    else
        echo "❌ Failed to start FreeSWITCH"
        docker logs aidevelo-freeswitch --tail 30
        exit 1
    fi
fi
echo ""

# 2. Check FreeSWITCH port
echo "2. Checking FreeSWITCH port 7443..."
if netstat -tulpn 2>/dev/null | grep -q ":7443" || ss -tulpn 2>/dev/null | grep -q ":7443"; then
    echo "✅ Port 7443 is LISTENING"
    netstat -tulpn 2>/dev/null | grep 7443 || ss -tulpn 2>/dev/null | grep 7443
else
    echo "⚠️  Port 7443 not visible (may be inside container)"
    docker exec aidevelo-freeswitch netstat -tulpn 2>/dev/null | grep 7443 || echo "Checking container..."
fi
echo ""

# 3. Check FreeSWITCH status
echo "3. Checking FreeSWITCH status..."
if docker exec aidevelo-freeswitch fs_cli -x "status" 2>/dev/null | grep -q "UP"; then
    echo "✅ FreeSWITCH is responding"
    docker exec aidevelo-freeswitch fs_cli -x "status" | head -3
else
    echo "⚠️  FreeSWITCH not responding (may need time to start)"
fi
echo ""

# 4. Check Cloudflare Tunnel
echo "4. Checking Cloudflare Tunnel..."
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    echo "✅ Cloudflare Tunnel is RUNNING"
    systemctl status cloudflared --no-pager | head -5
else
    echo "❌ Cloudflare Tunnel is NOT running"
    echo "Starting tunnel..."
    systemctl start cloudflared 2>/dev/null || { echo "❌ Failed to start tunnel"; exit 1; }
    sleep 2
    if systemctl is-active --quiet cloudflared; then
        echo "✅ Cloudflare Tunnel started"
    else
        echo "❌ Failed to start Cloudflare Tunnel"
        journalctl -u cloudflared -n 10 --no-pager
        exit 1
    fi
fi
echo ""

# 5. Check tunnel config
echo "5. Checking Cloudflare Tunnel config..."
CONFIG_FILE="$HOME/.cloudflared/config.yml"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Config file exists"
    echo "Config contents:"
    cat "$CONFIG_FILE"
    echo ""
    
    # Check if it has WebSocket support
    if grep -q "originRequest" "$CONFIG_FILE"; then
        echo "✅ Config has originRequest (WebSocket support)"
    else
        echo "⚠️  Config missing originRequest - run fix_tunnel_websocket.sh"
    fi
else
    echo "❌ Config file not found: $CONFIG_FILE"
fi
echo ""

echo "=== Verification Complete ==="
echo ""
echo "If FreeSWITCH and Tunnel are running, test at:"
echo "https://aidevelo.ai/dashboard/test-call"
echo ""

