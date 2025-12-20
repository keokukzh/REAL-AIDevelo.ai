#!/bin/bash
# Script to check FreeSWITCH on Hetzner server
# Run this on the server via SSH

echo "=== FreeSWITCH Status Check ==="
echo ""

# Check if FreeSWITCH container is running
echo "1. Checking FreeSWITCH container..."
if docker ps | grep -q freeswitch; then
    echo "✅ FreeSWITCH container is RUNNING"
    docker ps | grep freeswitch
else
    echo "❌ FreeSWITCH container is NOT running"
    echo "Starting FreeSWITCH..."
    cd ~/REAL-AIDevelo.ai
    docker compose up -d freeswitch
    sleep 5
    if docker ps | grep -q freeswitch; then
        echo "✅ FreeSWITCH started successfully"
    else
        echo "❌ Failed to start FreeSWITCH"
        docker logs aidevelo-freeswitch --tail 20
    fi
fi

echo ""
echo "2. Checking FreeSWITCH port 7443..."
if netstat -tulpn 2>/dev/null | grep -q ":7443"; then
    echo "✅ Port 7443 is LISTENING"
    netstat -tulpn | grep 7443
else
    echo "❌ Port 7443 is NOT listening"
fi

echo ""
echo "3. Checking FreeSWITCH status..."
if docker exec aidevelo-freeswitch fs_cli -x "status" 2>/dev/null | grep -q "UP"; then
    echo "✅ FreeSWITCH is responding"
    docker exec aidevelo-freeswitch fs_cli -x "status" | head -5
else
    echo "❌ FreeSWITCH is NOT responding"
fi

echo ""
echo "4. Checking Cloudflare Tunnel..."
if systemctl is-active --quiet cloudflared; then
    echo "✅ Cloudflare Tunnel is RUNNING"
    systemctl status cloudflared --no-pager | head -5
else
    echo "❌ Cloudflare Tunnel is NOT running"
    echo "Starting tunnel..."
    systemctl start cloudflared
    sleep 2
    if systemctl is-active --quiet cloudflared; then
        echo "✅ Cloudflare Tunnel started"
    else
        echo "❌ Failed to start Cloudflare Tunnel"
        journalctl -u cloudflared -n 10 --no-pager
    fi
fi

echo ""
echo "=== Check Complete ==="

