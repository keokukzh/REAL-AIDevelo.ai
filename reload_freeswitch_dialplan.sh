#!/bin/bash
# Reload FreeSWITCH dialplan after changes
# Run this on the Hetzner server

echo "=== Reloading FreeSWITCH Dialplan ==="
echo ""

# Check if FreeSWITCH container is running
if ! docker ps | grep -q freeswitch; then
    echo "❌ FreeSWITCH container is NOT running"
    exit 1
fi

echo "✅ FreeSWITCH container is running"
echo ""

# Reload XML configuration (includes dialplan)
echo "Reloading FreeSWITCH XML configuration..."
docker exec aidevelo-freeswitch fs_cli -x "reloadxml"
sleep 2

# Verify dialplan is loaded
echo "Checking dialplan status..."
docker exec aidevelo-freeswitch fs_cli -x "dialplan reload" 2>&1

# Show extension 1000 from dialplan
echo ""
echo "Extension 1000 configuration:"
docker exec aidevelo-freeswitch fs_cli -x "xml_locate dialplan default 1000" 2>&1 | head -20

echo ""
echo "=== Dialplan Reloaded ==="
echo "Test call should now play greeting and echo audio"
echo ""

