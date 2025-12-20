#!/bin/bash
# Verify FreeSWITCH setup for own agent
# Run this on the Hetzner server

echo "=== Verifying FreeSWITCH Setup ==="
echo ""

# 1. Check FreeSWITCH is running
echo "1. FreeSWITCH Status:"
docker ps | grep freeswitch
echo ""

# 2. Check environment variables
echo "2. Environment Variables:"
docker exec aidevelo-freeswitch env | grep -E "BACKEND_URL|PUBLIC_BASE_URL" || echo "⚠️  No backend URL env vars found"
echo ""

# 3. Test backend connectivity from FreeSWITCH
echo "3. Testing Backend Connectivity:"
BACKEND_URL="https://real-aidevelo-ai.onrender.com"
echo "Testing: $BACKEND_URL/api/v1/freeswitch/greeting?location_id=test"
docker exec aidevelo-freeswitch curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$BACKEND_URL/api/v1/freeswitch/greeting?location_id=test" || echo "⚠️  Backend not reachable"
echo ""

# 4. Check dialplan
echo "4. Dialplan Extension 1000:"
docker exec aidevelo-freeswitch cat /usr/share/freeswitch/conf/dialplan/default/00_default.xml | grep -A 5 "1000" | head -10
echo ""

# 5. Check scripts
echo "5. Scripts Check:"
echo "call_controller.lua:"
docker exec aidevelo-freeswitch head -10 /usr/share/freeswitch/scripts/call_controller.lua | grep -E "backend_url|PUBLIC_BASE_URL"
echo ""
echo "notify_hangup.lua:"
docker exec aidevelo-freeswitch head -10 /usr/share/freeswitch/scripts/notify_hangup.lua | grep -E "backend_url|PUBLIC_BASE_URL"
echo ""

# 6. Check FreeSWITCH logs for errors
echo "6. Recent FreeSWITCH Logs (errors/warnings):"
docker logs aidevelo-freeswitch --tail 20 2>&1 | grep -i "error\|warn\|fail" | tail -5 || echo "No recent errors"
echo ""

echo "=== Verification Complete ==="
echo ""
echo "If backend URL is not set, update docker-compose.yml or set environment variable:"
echo "  docker exec aidevelo-freeswitch sh -c 'export PUBLIC_BASE_URL=https://real-aidevelo-ai.onrender.com'"
echo ""

