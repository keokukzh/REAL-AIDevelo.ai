#!/bin/bash
# Script to start FreeSWITCH on Hetzner server
# Run this on the server via SSH

set -e

echo "=========================================="
echo "Starting FreeSWITCH on Hetzner Server"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to project directory
cd ~/REAL-AIDevelo.ai || {
    echo -e "${RED}❌ Project directory not found${NC}"
    exit 1
}

# Check if already running
if docker ps | grep -q freeswitch; then
    echo -e "${GREEN}✅ FreeSWITCH is already running${NC}"
    docker ps | grep freeswitch
    exit 0
fi

# Start FreeSWITCH
echo "Starting FreeSWITCH container..."
docker compose up -d freeswitch

# Wait for container to start
echo "Waiting for FreeSWITCH to start (30 seconds)..."
sleep 30

# Check if started successfully
if docker ps | grep -q freeswitch; then
    echo -e "${GREEN}✅ FreeSWITCH started successfully${NC}"
    docker ps | grep freeswitch
    
    # Check FreeSWITCH status
    echo ""
    echo "Checking FreeSWITCH status..."
    sleep 5
    if docker exec aidevelo-freeswitch fs_cli -x "status" 2>/dev/null | grep -q "UP"; then
        echo -e "${GREEN}✅ FreeSWITCH is responding${NC}"
        docker exec aidevelo-freeswitch fs_cli -x "status" | head -3
    else
        echo -e "${YELLOW}⚠️  FreeSWITCH started but not responding yet${NC}"
        echo "   This is normal, it may need a few more seconds..."
        echo "   Check logs: docker logs aidevelo-freeswitch --tail 20"
    fi
    
    # Show recent logs
    echo ""
    echo "Recent logs:"
    docker logs aidevelo-freeswitch --tail 10
    
    echo ""
    echo -e "${GREEN}✅ FreeSWITCH startup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run status check: ./scripts/check_freeswitch_status.sh"
    echo "2. Test in browser: https://aidevelo.ai/dashboard/test-call"
else
    echo -e "${RED}❌ Failed to start FreeSWITCH${NC}"
    echo ""
    echo "Checking logs:"
    docker logs aidevelo-freeswitch --tail 30
    exit 1
fi

