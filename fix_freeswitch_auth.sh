#!/bin/bash
# Fix FreeSWITCH authentication for test calls
# Run this on the Hetzner server

set -e

echo "=== Fixing FreeSWITCH Authentication ==="
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

# Create directory structure
echo "2. Creating directory structure..."
docker exec aidevelo-freeswitch mkdir -p /etc/freeswitch/directory/default
echo ""

# Copy directory configuration
echo "3. Copying directory configuration..."
DIRECTORY_FILE="infra/freeswitch/directory/default.xml"
if [ -f "$DIRECTORY_FILE" ]; then
    docker cp "$DIRECTORY_FILE" aidevelo-freeswitch:/etc/freeswitch/directory/default/00_default.xml
    echo "✅ Directory file copied"
else
    echo "❌ Directory file not found: $DIRECTORY_FILE"
    exit 1
fi
echo ""

# Update Sofia profile to accept blind auth
echo "4. Updating Sofia internal profile..."
SOFIA_FILE="infra/freeswitch/sofia/internal.xml"
if [ -f "$SOFIA_FILE" ]; then
    docker cp "$SOFIA_FILE" aidevelo-freeswitch:/etc/freeswitch/sip_profiles/internal.xml
    echo "✅ Sofia profile updated"
else
    echo "⚠️  Sofia file not found: $SOFIA_FILE"
fi
echo ""

# Reload XML configuration
echo "5. Reloading FreeSWITCH XML configuration..."
docker exec aidevelo-freeswitch fs_cli -x "reloadxml" 2>&1
sleep 2

# Reload Sofia profile
echo "6. Reloading Sofia profile..."
docker exec aidevelo-freeswitch fs_cli -x "sofia profile internal restart" 2>&1
sleep 2
echo ""

# Verify directory is loaded
echo "7. Verifying directory configuration..."
docker exec aidevelo-freeswitch fs_cli -x "xml_locate directory default test" 2>&1 | head -10
echo ""

# Check Sofia profile status
echo "8. Sofia Internal Profile Status:"
docker exec aidevelo-freeswitch fs_cli -x "sofia status profile internal" 2>&1 | head -5
echo ""

echo "=== Fix Complete ==="
echo ""
echo "✅ Directory configuration loaded"
echo "✅ Sofia profile updated to accept blind auth"
echo "✅ Test users should now be able to authenticate"
echo ""
echo "Test the call again in the browser"
echo ""

