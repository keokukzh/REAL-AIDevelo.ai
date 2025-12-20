#!/bin/bash
# Fix ESL to use IPv4 instead of IPv6

echo "=== Fixing ESL to IPv4 ==="
echo ""

# Fix event_socket.conf.xml to use IPv4
echo "1. Changing ESL to IPv4 (0.0.0.0 instead of ::)..."
docker exec aidevelo-freeswitch sh -c "cat > /etc/freeswitch/autoload_configs/event_socket.conf.xml <<'EOF'
<configuration name=\"event_socket.conf\" description=\"Socket Client\">
  <settings>
    <param name=\"nat-map\" value=\"false\"/>
    <param name=\"listen-ip\" value=\"0.0.0.0\"/>
    <param name=\"listen-port\" value=\"8021\"/>
    <param name=\"password\" value=\"ClueCon\"/>
  </settings>
</configuration>
EOF
" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ ESL config updated to IPv4"
else
  echo "❌ Failed to update ESL config"
  exit 1
fi

# Restart FreeSWITCH
echo ""
echo "2. Restarting FreeSWITCH..."
cd ~/REAL-AIDevelo.ai
docker compose restart freeswitch

echo ""
echo "Waiting 20 seconds for FreeSWITCH to start..."
sleep 20

# Test ESL
echo ""
echo "3. Testing ESL connection..."
docker exec aidevelo-freeswitch fs_cli -H 127.0.0.1 -P 8021 -p ClueCon -x 'status' 2>&1 | head -5

if [ $? -eq 0 ]; then
  echo "✅ ESL works!"
  
  # Start internal profile
  echo ""
  echo "4. Starting internal profile to load WSS..."
  docker exec aidevelo-freeswitch fs_cli -H 127.0.0.1 -P 8021 -p ClueCon -x 'sofia profile internal start' 2>&1
  
  sleep 5
  
  # Check sofia status
  echo ""
  echo "5. Checking Sofia status..."
  docker exec aidevelo-freeswitch fs_cli -H 127.0.0.1 -P 8021 -p ClueCon -x 'sofia status profile internal' 2>&1 | head -30
  
  # Check ports
  echo ""
  echo "6. Checking if port 7443 is listening..."
  docker exec aidevelo-freeswitch netstat -tuln 2>/dev/null | grep 7443 || \
  docker exec aidevelo-freeswitch ss -tuln 2>/dev/null | grep 7443 || \
  echo "⚠️ Port 7443 still not listening"
else
  echo "❌ ESL still not working"
  echo "Check logs: docker logs aidevelo-freeswitch --tail 50"
fi

echo ""
echo "=== Fix Complete ==="

