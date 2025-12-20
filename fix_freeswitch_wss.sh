#!/bin/bash
# Fix FreeSWITCH WSS - Create SSL certificate and restart profile

echo "=== FreeSWITCH WSS Fix ==="
echo ""

# Find certs directory
echo "1. Finding FreeSWITCH certs directory..."
CERTS_DIR=$(docker exec aidevelo-freeswitch eval 'echo $${certs_dir}' 2>/dev/null | tail -1)
if [ -z "$CERTS_DIR" ]; then
  CERTS_DIR="/usr/local/freeswitch/certs"
fi
echo "Certs directory: $CERTS_DIR"

# Check if wss.pem exists
echo ""
echo "2. Checking for wss.pem..."
docker exec aidevelo-freeswitch ls -la "$CERTS_DIR/wss.pem" 2>&1
if [ $? -ne 0 ]; then
  echo "❌ wss.pem NOT FOUND - Creating self-signed certificate..."
  
  # Create certs directory if it doesn't exist
  docker exec aidevelo-freeswitch mkdir -p "$CERTS_DIR" 2>/dev/null
  
  # Generate self-signed certificate
  docker exec aidevelo-freeswitch openssl req -x509 -newkey rsa:2048 -keyout "$CERTS_DIR/wss.pem" -out "$CERTS_DIR/wss.pem" -days 365 -nodes -subj "/CN=freeswitch.aidevelo.ai" 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✅ Certificate created: $CERTS_DIR/wss.pem"
    docker exec aidevelo-freeswitch chmod 644 "$CERTS_DIR/wss.pem" 2>/dev/null
  else
    echo "❌ Failed to create certificate"
    exit 1
  fi
else
  echo "✅ wss.pem exists"
fi

# Check if port 7443 is listening
echo ""
echo "3. Checking if FreeSWITCH listens on port 7443..."
docker exec aidevelo-freeswitch netstat -tulpn 2>/dev/null | grep 7443 || \
docker exec aidevelo-freeswitch ss -tulpn 2>/dev/null | grep 7443 || \
echo "⚠️ Port 7443 not listening - Profile may not be loaded"

# Restart internal profile to load WSS binding
echo ""
echo "4. Restarting internal profile to load WSS..."
# Try to restart via fs_cli (may fail if ESL not configured)
docker exec aidevelo-freeswitch fs_cli -x 'sofia profile internal restart' 2>&1 || echo "⚠️ Could not restart via fs_cli"

# Alternative: Restart FreeSWITCH container
echo ""
echo "5. Restarting FreeSWITCH container to apply changes..."
cd ~/REAL-AIDevelo.ai
docker compose restart freeswitch

echo ""
echo "Waiting 10 seconds for FreeSWITCH to start..."
sleep 10

# Check again
echo ""
echo "6. Verifying port 7443 after restart..."
docker exec aidevelo-freeswitch netstat -tulpn 2>/dev/null | grep 7443 || \
docker exec aidevelo-freeswitch ss -tulpn 2>/dev/null | grep 7443 || \
echo "⚠️ Port 7443 still not listening"

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Check FreeSWITCH logs: docker logs aidevelo-freeswitch --tail 50"
echo "2. Test WebSocket: curl -v -H 'Upgrade: websocket' http://localhost:7443/"
echo "3. Test in browser: https://aidevelo.ai/dashboard/test-call"

