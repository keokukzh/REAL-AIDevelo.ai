#!/bin/bash
# Check FreeSWITCH call handling and dialplan
# Run this on the Hetzner server

echo "=== FreeSWITCH Call Diagnostics ==="
echo ""

# 1. Check if FreeSWITCH is running
echo "1. FreeSWITCH Container Status:"
docker ps | grep freeswitch
echo ""

# 2. Check FreeSWITCH status
echo "2. FreeSWITCH Status:"
docker exec aidevelo-freeswitch fs_cli -x "status" 2>/dev/null | head -5
echo ""

# 3. Check dialplan is loaded
echo "3. Dialplan Extension 1000:"
docker exec aidevelo-freeswitch fs_cli -x "xml_locate dialplan default 1000" 2>&1
echo ""

# 4. Check active calls
echo "4. Active Calls:"
docker exec aidevelo-freeswitch fs_cli -x "show calls" 2>&1
echo ""

# 5. Check recent FreeSWITCH logs for call attempts
echo "5. Recent Call Logs (last 20 lines):"
docker logs aidevelo-freeswitch --tail 20 2>&1 | grep -i "call\|invite\|1000\|answer" || echo "No call-related logs found"
echo ""

# 6. Check if dialplan file exists in container
echo "6. Dialplan File Check:"
docker exec aidevelo-freeswitch ls -la /usr/share/freeswitch/conf/dialplan/default/ 2>&1 | grep -i "default\|00_default"
echo ""

# 7. Show dialplan content
echo "7. Dialplan Content (extension 1000):"
docker exec aidevelo-freeswitch cat /usr/share/freeswitch/conf/dialplan/default/00_default.xml 2>&1 | grep -A 20 "1000" || echo "Dialplan file not found or extension 1000 not found"
echo ""

# 8. Test dialplan lookup
echo "8. Test Dialplan Lookup:"
docker exec aidevelo-freeswitch fs_cli -x "dialplan reload" 2>&1
docker exec aidevelo-freeswitch fs_cli -x "xml_locate dialplan default 1000" 2>&1
echo ""

# 9. Check Sofia profile status
echo "9. Sofia Internal Profile:"
docker exec aidevelo-freeswitch fs_cli -x "sofia status profile internal" 2>&1 | head -10
echo ""

# 10. Check for errors in logs
echo "10. Recent Errors:"
docker logs aidevelo-freeswitch --tail 50 2>&1 | grep -i "error\|fail\|warn" | tail -10 || echo "No recent errors"
echo ""

echo "=== Diagnostics Complete ==="
echo ""
echo "If dialplan is not loaded, run:"
echo "  docker cp infra/freeswitch/dialplan/default.xml aidevelo-freeswitch:/usr/share/freeswitch/conf/dialplan/default/00_default.xml"
echo "  docker exec aidevelo-freeswitch fs_cli -x 'reloadxml'"
echo ""

