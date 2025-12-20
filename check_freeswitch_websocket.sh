#!/bin/bash
# Check FreeSWITCH WebSocket configuration

echo "=== FreeSWITCH WebSocket Check ==="
echo ""

# Check if FreeSWITCH is running
echo "1. FreeSWITCH Container Status:"
docker ps | grep freeswitch
echo ""

# Check FreeSWITCH logs for WebSocket
echo "2. FreeSWITCH Logs (WebSocket related):"
docker logs aidevelo-freeswitch --tail 100 | grep -i -E "(websocket|wss|ws-binding|sofia)" | head -20
echo ""

# Check if port 7443 is listening
echo "3. Port 7443 Status:"
netstat -tulpn | grep 7443 || ss -tulpn | grep 7443
echo ""

# Try to connect to FreeSWITCH WebSocket locally
echo "4. Testing local WebSocket connection:"
timeout 3 curl -v -H "Upgrade: websocket" -H "Connection: Upgrade" -H "Sec-WebSocket-Protocol: sip" http://localhost:7443/ 2>&1 | head -30
echo ""

# Check FreeSWITCH sofia status
echo "5. FreeSWITCH Sofia Status:"
docker exec aidevelo-freeswitch fs_cli -x "sofia status" 2>/dev/null | head -20
echo ""

# Check if mod_sofia is loaded
echo "6. FreeSWITCH Modules (mod_sofia):"
docker exec aidevelo-freeswitch fs_cli -x "module_exists mod_sofia" 2>/dev/null
echo ""

echo "=== Check Complete ==="

