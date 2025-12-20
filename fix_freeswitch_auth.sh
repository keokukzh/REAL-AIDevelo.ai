#!/bin/bash
# Fix FreeSWITCH authentication to allow unregistered calls

set -e

PROJECT_DIR="${1:-$(pwd)}"
cd "$PROJECT_DIR" || exit 1

echo "=== Fixing FreeSWITCH Authentication ==="
echo "Project directory: $PROJECT_DIR"

# Check if FreeSWITCH container is running
if ! docker ps | grep -q aidevelo-freeswitch; then
    echo "❌ FreeSWITCH container is not running"
    echo "Starting FreeSWITCH..."
    docker compose up -d freeswitch
    sleep 5
fi

echo "✅ FreeSWITCH container is running"

# Copy updated Sofia profile
echo "2. Copying updated Sofia profile..."
docker cp infra/freeswitch/sofia/internal.xml aidevelo-freeswitch:/etc/freeswitch/sip_profiles/internal.xml

# Reload FreeSWITCH configuration
echo "3. Reloading FreeSWITCH configuration..."
docker exec aidevelo-freeswitch fs_cli -x "reloadxml"
docker exec aidevelo-freeswitch fs_cli -x "sofia profile internal rescan reloadxml"

echo ""
echo "✅ FreeSWITCH authentication fixed!"
echo ""
echo "Changes applied:"
echo "  - accept-blind-auth: true"
echo "  - accept-unregistered-calls: true"
echo "  - auth-calls: false (for WebRTC test calls)"
echo ""
echo "FreeSWITCH should now accept calls without registration."
echo "Test the call again in the browser."
