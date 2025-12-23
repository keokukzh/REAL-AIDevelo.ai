#!/bin/bash
# Comprehensive FreeSWITCH Status Check Script
# Run this on the Hetzner server via SSH: ssh root@91.99.202.18

set -e

echo "=========================================="
echo "FreeSWITCH Status Check - AIDevelo.ai"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_OK=true

# 1. Check FreeSWITCH Container
echo "1. Checking FreeSWITCH Container..."
if docker ps | grep -q freeswitch; then
    echo -e "${GREEN}✅ FreeSWITCH container is RUNNING${NC}"
    docker ps | grep freeswitch | head -1
else
    echo -e "${RED}❌ FreeSWITCH container is NOT running${NC}"
    ALL_OK=false
fi
echo ""

# 2. Check FreeSWITCH Port
echo "2. Checking FreeSWITCH Port 7443..."
if netstat -tulpn 2>/dev/null | grep -q ":7443" || ss -tulpn 2>/dev/null | grep -q ":7443"; then
    echo -e "${GREEN}✅ Port 7443 is LISTENING${NC}"
    netstat -tulpn 2>/dev/null | grep 7443 || ss -tulpn 2>/dev/null | grep 7443
else
    echo -e "${YELLOW}⚠️  Port 7443 not visible (may be inside container)${NC}"
    if docker ps | grep -q freeswitch; then
        echo "   Checking inside container..."
        docker exec aidevelo-freeswitch netstat -tulpn 2>/dev/null | grep 7443 || echo "   Port check inside container failed"
    fi
fi
echo ""

# 3. Check FreeSWITCH Status
echo "3. Checking FreeSWITCH Status..."
if docker ps | grep -q freeswitch; then
    if docker exec aidevelo-freeswitch fs_cli -x "status" 2>/dev/null | grep -q "UP"; then
        echo -e "${GREEN}✅ FreeSWITCH is responding${NC}"
        docker exec aidevelo-freeswitch fs_cli -x "status" | head -3
    else
        echo -e "${RED}❌ FreeSWITCH is NOT responding${NC}"
        ALL_OK=false
    fi
else
    echo -e "${RED}❌ Cannot check FreeSWITCH status (container not running)${NC}"
    ALL_OK=false
fi
echo ""

# 4. Check Cloudflare Tunnel
echo "4. Checking Cloudflare Tunnel..."
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    echo -e "${GREEN}✅ Cloudflare Tunnel is RUNNING${NC}"
    systemctl status cloudflared --no-pager | head -3
else
    echo -e "${RED}❌ Cloudflare Tunnel is NOT running${NC}"
    ALL_OK=false
fi
echo ""

# 5. Check DNS Resolution
echo "5. Checking DNS Resolution..."
if nslookup freeswitch.aidevelo.ai 2>/dev/null | grep -q "Address:"; then
    echo -e "${GREEN}✅ DNS resolves for freeswitch.aidevelo.ai${NC}"
    nslookup freeswitch.aidevelo.ai 2>/dev/null | grep "Address:" | head -2
else
    echo -e "${YELLOW}⚠️  DNS resolution check failed${NC}"
fi
echo ""

# 6. Check Environment Variables
echo "6. Checking Environment Variables..."
if [ -f ~/REAL-AIDevelo.ai/.env ]; then
    if grep -q "PUBLIC_BASE_URL" ~/REAL-AIDevelo.ai/.env; then
        echo -e "${GREEN}✅ .env file exists with PUBLIC_BASE_URL${NC}"
        grep "PUBLIC_BASE_URL" ~/REAL-AIDevelo.ai/.env | head -1
    else
        echo -e "${YELLOW}⚠️  .env file exists but PUBLIC_BASE_URL not found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
fi
echo ""

# 7. Check Recent Logs
echo "7. Checking Recent FreeSWITCH Logs..."
if docker ps | grep -q freeswitch; then
    echo "Last 10 lines:"
    docker logs aidevelo-freeswitch --tail 10 2>&1 | tail -5
else
    echo -e "${RED}❌ Cannot check logs (container not running)${NC}"
fi
echo ""

# Summary
echo "=========================================="
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✅ All checks passed! FreeSWITCH should be ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test connection: https://aidevelo.ai/dashboard/test-call"
    echo "2. Click 'Mit FreeSWITCH verbinden'"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review above.${NC}"
    echo ""
    echo "To start FreeSWITCH:"
    echo "  cd ~/REAL-AIDevelo.ai"
    echo "  docker compose up -d freeswitch"
    echo "  sleep 30"
    echo "  ./scripts/check_freeswitch_status.sh"
    exit 1
fi

