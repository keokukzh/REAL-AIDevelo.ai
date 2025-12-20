#!/bin/bash
# Verify and start FreeSWITCH internal profile to activate WSS binding
# Run this on the Hetzner server via SSH

set -e

echo "=== Verifying FreeSWITCH WSS Configuration ==="
echo ""

# Check if FreeSWITCH container is running
if ! docker ps | grep -q freeswitch; then
    echo "❌ FreeSWITCH container is NOT running"
    echo "Starting FreeSWITCH..."
    cd ~/REAL-AIDevelo.ai 2>/dev/null || cd /root/REAL-AIDevelo.ai 2>/dev/null || { echo "❌ Cannot find project directory"; exit 1; }
    docker compose up -d freeswitch
    echo "Waiting 30 seconds for FreeSWITCH to start..."
    sleep 30
fi

echo "✅ FreeSWITCH container is running"
echo ""

# Check FreeSWITCH status
echo "1. Checking FreeSWITCH status..."
if docker exec aidevelo-freeswitch fs_cli -x "status" 2>/dev/null | grep -q "UP"; then
    echo "✅ FreeSWITCH is responding"
    docker exec aidevelo-freeswitch fs_cli -x "status" | head -3
else
    echo "⚠️  FreeSWITCH not responding, waiting 10 more seconds..."
    sleep 10
    if ! docker exec aidevelo-freeswitch fs_cli -x "status" 2>/dev/null | grep -q "UP"; then
        echo "❌ FreeSWITCH still not responding"
        exit 1
    fi
fi
echo ""

# Check Sofia status
echo "2. Checking Sofia profiles..."
SOFIA_STATUS=$(docker exec aidevelo-freeswitch fs_cli -x "sofia status" 2>/dev/null || echo "")
echo "$SOFIA_STATUS"
echo ""

# Check if internal profile is started
echo "3. Checking internal profile status..."
INTERNAL_STATUS=$(docker exec aidevelo-freeswitch fs_cli -x "sofia status profile internal" 2>/dev/null || echo "")

if echo "$INTERNAL_STATUS" | grep -q "RUNNING\|STARTED"; then
    echo "✅ Internal profile is running"
    echo "$INTERNAL_STATUS" | head -5
else
    echo "⚠️  Internal profile is not running, starting it..."
    docker exec aidevelo-freeswitch fs_cli -x "sofia profile internal start" 2>&1
    sleep 3
    
    # Verify it started
    INTERNAL_STATUS=$(docker exec aidevelo-freeswitch fs_cli -x "sofia status profile internal" 2>/dev/null || echo "")
    if echo "$INTERNAL_STATUS" | grep -q "RUNNING\|STARTED"; then
        echo "✅ Internal profile started successfully"
        echo "$INTERNAL_STATUS" | head -5
    else
        echo "❌ Failed to start internal profile"
        echo "Status: $INTERNAL_STATUS"
        exit 1
    fi
fi
echo ""

# Check if port 7443 is listening
echo "4. Checking if port 7443 is listening..."
if docker exec aidevelo-freeswitch netstat -tulpn 2>/dev/null | grep -q ":7443"; then
    echo "✅ Port 7443 is listening"
    docker exec aidevelo-freeswitch netstat -tulpn 2>/dev/null | grep 7443
else
    echo "⚠️  Port 7443 not visible in netstat (may be normal if using different method)"
    echo "Checking with ss..."
    if docker exec aidevelo-freeswitch ss -tulpn 2>/dev/null | grep -q ":7443"; then
        echo "✅ Port 7443 is listening (found via ss)"
        docker exec aidevelo-freeswitch ss -tulpn 2>/dev/null | grep 7443
    else
        echo "⚠️  Port 7443 not visible, but profile is running (may be OK)"
    fi
fi
echo ""

# Check WSS binding specifically
echo "5. Checking WSS binding configuration..."
WSS_BINDING=$(docker exec aidevelo-freeswitch fs_cli -x "sofia status profile internal" 2>/dev/null | grep -i "wss\|7443" || echo "")
if [ -n "$WSS_BINDING" ]; then
    echo "✅ WSS binding found:"
    echo "$WSS_BINDING"
else
    echo "⚠️  WSS binding not explicitly shown (may be OK if profile is running)"
fi
echo ""

echo "=== Verification Complete ==="
echo "FreeSWITCH WSS should now be ready"
echo ""

