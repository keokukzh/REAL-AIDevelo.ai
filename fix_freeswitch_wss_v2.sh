#!/bin/bash
# Fix FreeSWITCH WSS - Create SSL certificate on host and copy to container

echo "=== FreeSWITCH WSS Fix ==="
echo ""

# Create certs directory in container
echo "1. Creating certs directory in FreeSWITCH container..."
docker exec aidevelo-freeswitch mkdir -p /usr/local/freeswitch/certs 2>/dev/null || \
docker exec aidevelo-freeswitch mkdir -p /etc/freeswitch/certs 2>/dev/null

# Find which directory exists
CERTS_DIR=""
if docker exec aidevelo-freeswitch test -d /usr/local/freeswitch/certs 2>/dev/null; then
  CERTS_DIR="/usr/local/freeswitch/certs"
elif docker exec aidevelo-freeswitch test -d /etc/freeswitch/certs 2>/dev/null; then
  CERTS_DIR="/etc/freeswitch/certs"
else
  # Try to find it
  CERTS_DIR=$(docker exec aidevelo-freeswitch find /usr -type d -name certs 2>/dev/null | grep freeswitch | head -1)
  if [ -z "$CERTS_DIR" ]; then
    CERTS_DIR="/usr/local/freeswitch/certs"
    docker exec aidevelo-freeswitch mkdir -p "$CERTS_DIR" 2>/dev/null
  fi
fi

echo "Using certs directory: $CERTS_DIR"

# Check if wss.pem exists
echo ""
echo "2. Checking for wss.pem..."
if docker exec aidevelo-freeswitch test -f "$CERTS_DIR/wss.pem" 2>/dev/null; then
  echo "✅ wss.pem exists at $CERTS_DIR/wss.pem"
else
  echo "❌ wss.pem NOT FOUND - Creating self-signed certificate on host..."
  
  # Create temporary directory
  TEMP_DIR=$(mktemp -d)
  cd "$TEMP_DIR"
  
  # Generate self-signed certificate
  openssl req -x509 -newkey rsa:2048 -keyout wss.key -out wss.crt -days 365 -nodes -subj "/CN=freeswitch.aidevelo.ai" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    # Combine key and cert into pem file
    cat wss.key wss.crt > wss.pem
    chmod 644 wss.pem
    
    # Copy to container
    docker cp wss.pem aidevelo-freeswitch:"$CERTS_DIR/wss.pem" 2>/dev/null
    
    if [ $? -eq 0 ]; then
      echo "✅ Certificate created and copied to $CERTS_DIR/wss.pem"
      docker exec aidevelo-freeswitch chmod 644 "$CERTS_DIR/wss.pem" 2>/dev/null
    else
      echo "❌ Failed to copy certificate to container"
      rm -rf "$TEMP_DIR"
      exit 1
    fi
    
    # Cleanup
    rm -rf "$TEMP_DIR"
  else
    echo "❌ Failed to create certificate"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
fi

# Verify certificate
echo ""
echo "3. Verifying certificate..."
docker exec aidevelo-freeswitch ls -lh "$CERTS_DIR/wss.pem" 2>/dev/null

# Restart FreeSWITCH to load WSS
echo ""
echo "4. Restarting FreeSWITCH container to load WSS binding..."
cd ~/REAL-AIDevelo.ai
docker compose restart freeswitch

echo ""
echo "Waiting 15 seconds for FreeSWITCH to start..."
sleep 15

# Check if port 7443 is listening
echo ""
echo "5. Checking if FreeSWITCH listens on port 7443..."
if docker exec aidevelo-freeswitch netstat -tulpn 2>/dev/null | grep -q 7443 || \
   docker exec aidevelo-freeswitch ss -tulpn 2>/dev/null | grep -q 7443; then
  echo "✅ Port 7443 is listening!"
else
  echo "⚠️ Port 7443 still not listening - Check FreeSWITCH logs"
  echo "Run: docker logs aidevelo-freeswitch --tail 50 | grep -i wss"
fi

# Check FreeSWITCH logs for WSS errors
echo ""
echo "6. Checking FreeSWITCH logs for WSS..."
docker logs aidevelo-freeswitch --tail 30 2>&1 | grep -i -E '(wss|websocket|7443|sofia.*start)' | tail -10 || echo "No WSS-related logs found"

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Test WebSocket locally: curl -v -H 'Upgrade: websocket' http://localhost:7443/"
echo "2. Test in browser: https://aidevelo.ai/dashboard/test-call"
echo "3. Check logs: docker logs aidevelo-freeswitch --tail 100"

