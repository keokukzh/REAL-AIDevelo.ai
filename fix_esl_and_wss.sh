#!/bin/bash
# Fix ESL and WSS - Configure Event Socket and ensure WSS starts

echo "=== FreeSWITCH ESL + WSS Fix ==="
echo ""

# Check if event_socket.conf.xml exists
echo "1. Checking ESL configuration..."
ESL_CONFIG="/etc/freeswitch/autoload_configs/event_socket.conf.xml"
if docker exec aidevelo-freeswitch test -f "$ESL_CONFIG" 2>/dev/null; then
  echo "✅ ESL config exists"
  docker exec aidevelo-freeswitch cat "$ESL_CONFIG" | grep -E '(listen-ip|listen-port|password)' | head -5
else
  echo "❌ ESL config NOT FOUND - Creating it..."
  
  # Create ESL config
  docker exec aidevelo-freeswitch sh -c "cat > $ESL_CONFIG <<'EOF'
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
    echo "✅ ESL config created"
  else
    echo "❌ Failed to create ESL config"
  fi
fi

# Check if FreeSWITCH is running
echo ""
echo "2. Checking FreeSWITCH process..."
if docker exec aidevelo-freeswitch ps aux | grep -q '[f]reeswitch'; then
  echo "✅ FreeSWITCH is running"
else
  echo "❌ FreeSWITCH is NOT running!"
  exit 1
fi

# Restart FreeSWITCH to load ESL and WSS
echo ""
echo "3. Restarting FreeSWITCH to load ESL and WSS..."
cd ~/REAL-AIDevelo.ai
docker compose restart freeswitch

echo ""
echo "Waiting 20 seconds for FreeSWITCH to fully start..."
sleep 20

# Check ESL
echo ""
echo "4. Testing ESL connection..."
docker exec aidevelo-freeswitch fs_cli -x 'status' 2>&1 | head -5
if [ $? -eq 0 ]; then
  echo "✅ ESL works!"
  
  # Start internal profile
  echo ""
  echo "5. Starting internal profile..."
  docker exec aidevelo-freeswitch fs_cli -x 'sofia profile internal start' 2>&1
  sleep 3
  
  # Check sofia status
  echo ""
  echo "6. Checking Sofia status..."
  docker exec aidevelo-freeswitch fs_cli -x 'sofia status' 2>&1 | head -20
else
  echo "⚠️ ESL still not working - check event_socket.conf.xml"
fi

# Check ports
echo ""
echo "7. Checking listening ports..."
docker exec aidevelo-freeswitch netstat -tulpn 2>/dev/null | grep -E '(5060|5066|7443|8021)' || \
docker exec aidevelo-freeswitch ss -tulpn 2>/dev/null | grep -E '(5060|5066|7443|8021)' || \
echo "⚠️ No ports found"

echo ""
echo "=== Fix Complete ==="

