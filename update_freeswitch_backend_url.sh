#!/bin/bash
# Update FreeSWITCH to use Render backend URL
# Run this on the Hetzner server

set -e

echo "=== Updating FreeSWITCH Backend URL ==="
echo ""

# Get project directory
PROJECT_DIR="$HOME/REAL-AIDevelo.ai"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="/root/REAL-AIDevelo.ai"
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Cannot find project directory"
    exit 1
fi

cd "$PROJECT_DIR"

echo "Project directory: $PROJECT_DIR"
echo ""

# Pull latest changes
echo "1. Pulling latest changes..."
git pull
echo ""

# Check if FreeSWITCH is running
if ! docker ps | grep -q freeswitch; then
    echo "❌ FreeSWITCH container is NOT running"
    exit 1
fi

echo "✅ FreeSWITCH container is running"
echo ""

# Set backend URL environment variable
BACKEND_URL="${PUBLIC_BASE_URL:-https://real-aidevelo-ai.onrender.com}"
echo "2. Setting backend URL: $BACKEND_URL"

# Update FreeSWITCH container environment
# Note: This requires restarting the container with new env var
echo "3. Updating FreeSWITCH environment..."
docker exec aidevelo-freeswitch sh -c "echo 'export PUBLIC_BASE_URL=$BACKEND_URL' >> /root/.bashrc" || true
docker exec aidevelo-freeswitch sh -c "export PUBLIC_BASE_URL=$BACKEND_URL" || true

# Copy updated scripts
echo "4. Copying updated scripts..."
docker cp infra/freeswitch/scripts/call_controller.lua aidevelo-freeswitch:/usr/share/freeswitch/scripts/call_controller.lua
docker cp infra/freeswitch/scripts/notify_hangup.lua aidevelo-freeswitch:/usr/share/freeswitch/scripts/notify_hangup.lua
echo "✅ Scripts updated"
echo ""

# Copy updated dialplan
echo "5. Copying updated dialplan..."
docker exec aidevelo-freeswitch mkdir -p /usr/share/freeswitch/conf/dialplan/default
docker cp infra/freeswitch/dialplan/default.xml aidevelo-freeswitch:/usr/share/freeswitch/conf/dialplan/default/00_default.xml
echo "✅ Dialplan updated"
echo ""

# Reload XML configuration
echo "6. Reloading FreeSWITCH XML configuration..."
docker exec aidevelo-freeswitch fs_cli -x "reloadxml" 2>&1
sleep 2
echo "✅ Configuration reloaded"
echo ""

echo "=== Update Complete ==="
echo ""
echo "✅ FreeSWITCH now uses backend URL: $BACKEND_URL"
echo "✅ Scripts updated to use /api/v1/freeswitch endpoints"
echo ""
echo "IMPORTANT: Restart FreeSWITCH container to apply PUBLIC_BASE_URL environment variable:"
echo "  docker restart aidevelo-freeswitch"
echo ""

