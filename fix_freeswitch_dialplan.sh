#!/bin/bash
# Fix FreeSWITCH dialplan for test calls
# Run this on the Hetzner server

set -e

echo "=== Fixing FreeSWITCH Dialplan ==="
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
    echo "Starting FreeSWITCH..."
    docker compose up -d freeswitch
    echo "Waiting 30 seconds for FreeSWITCH to start..."
    sleep 30
fi

echo "✅ FreeSWITCH container is running"
echo ""

# Check if dialplan file exists locally
DIALPLAN_FILE="infra/freeswitch/dialplan/default.xml"
if [ ! -f "$DIALPLAN_FILE" ]; then
    echo "❌ Dialplan file not found: $DIALPLAN_FILE"
    exit 1
fi

echo "2. Creating dialplan directory if it doesn't exist..."
docker exec aidevelo-freeswitch mkdir -p /usr/share/freeswitch/conf/dialplan/default
echo ""

echo "3. Copying dialplan to FreeSWITCH container..."
docker cp "$DIALPLAN_FILE" aidevelo-freeswitch:/usr/share/freeswitch/conf/dialplan/default/00_default.xml

# Verify file was copied
if docker exec aidevelo-freeswitch test -f /usr/share/freeswitch/conf/dialplan/default/00_default.xml; then
    echo "✅ Dialplan file copied successfully"
else
    echo "❌ Failed to copy dialplan file"
    exit 1
fi
echo ""

# Reload XML configuration
echo "4. Reloading FreeSWITCH XML configuration..."
docker exec aidevelo-freeswitch fs_cli -x "reloadxml" 2>&1
sleep 2

# Reload dialplan specifically
echo "5. Reloading dialplan..."
docker exec aidevelo-freeswitch fs_cli -x "dialplan reload" 2>&1
sleep 1
echo ""

# Verify extension 1000 is loaded
echo "6. Verifying extension 1000 is loaded..."
DIALPLAN_CHECK=$(docker exec aidevelo-freeswitch fs_cli -x "xml_locate dialplan default 1000" 2>&1)
if echo "$DIALPLAN_CHECK" | grep -q "1000"; then
    echo "✅ Extension 1000 found in dialplan"
    echo "$DIALPLAN_CHECK" | head -10
else
    echo "⚠️  Extension 1000 not found in dialplan"
    echo "Output: $DIALPLAN_CHECK"
fi
echo ""

# Show dialplan content
echo "7. Dialplan content (extension 1000):"
docker exec aidevelo-freeswitch cat /usr/share/freeswitch/conf/dialplan/default/00_default.xml 2>&1 | grep -A 20 "1000" || echo "Could not show dialplan content"
echo ""

# Check FreeSWITCH status
echo "8. FreeSWITCH Status:"
docker exec aidevelo-freeswitch fs_cli -x "status" 2>&1 | head -5
echo ""

# Check Sofia profile
echo "9. Sofia Internal Profile:"
docker exec aidevelo-freeswitch fs_cli -x "sofia status profile internal" 2>&1 | head -5
echo ""

echo "=== Fix Complete ==="
echo ""
echo "✅ Dialplan should now be loaded"
echo "✅ Extension 1000 should answer calls and play greeting"
echo ""
echo "Test the call again in the browser"
echo ""

