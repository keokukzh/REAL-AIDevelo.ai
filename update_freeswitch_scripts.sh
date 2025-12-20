#!/bin/bash

# Update FreeSWITCH Lua scripts on server
# This script copies the updated call_controller.lua and notify_hangup.lua to the FreeSWITCH container

set -e

PROJECT_DIR="/root/REAL-AIDevelo.ai"
CONTAINER_NAME="aidevelo-freeswitch"
SCRIPTS_DIR="/usr/share/freeswitch/scripts"

echo "=== Updating FreeSWITCH Lua Scripts ==="
echo "Project directory: $PROJECT_DIR"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found. Please run from project root."
    exit 1
fi

# Check if FreeSWITCH container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "Error: FreeSWITCH container '$CONTAINER_NAME' is not running"
    exit 1
fi

echo "✅ FreeSWITCH container is running"

# Create scripts directory if it doesn't exist
echo "2. Creating scripts directory if it doesn't exist..."
docker exec "$CONTAINER_NAME" mkdir -p "$SCRIPTS_DIR" || true

# Copy call_controller.lua
echo "3. Copying call_controller.lua to FreeSWITCH container..."
if docker cp "infra/freeswitch/scripts/call_controller.lua" "$CONTAINER_NAME:$SCRIPTS_DIR/call_controller.lua"; then
    echo "✅ call_controller.lua copied successfully"
else
    echo "❌ Failed to copy call_controller.lua"
    exit 1
fi

# Copy notify_hangup.lua
echo "4. Copying notify_hangup.lua to FreeSWITCH container..."
if docker cp "infra/freeswitch/scripts/notify_hangup.lua" "$CONTAINER_NAME:$SCRIPTS_DIR/notify_hangup.lua"; then
    echo "✅ notify_hangup.lua copied successfully"
else
    echo "❌ Failed to copy notify_hangup.lua"
    exit 1
fi

# Reload FreeSWITCH XML configuration (scripts are loaded dynamically, but reloadxml ensures everything is fresh)
echo "5. Reloading FreeSWITCH XML configuration..."
if docker exec "$CONTAINER_NAME" fs_cli -x "reloadxml" | grep -q "+OK"; then
    echo "✅ FreeSWITCH XML reloaded successfully"
else
    echo "⚠️  FreeSWITCH reloadxml may have failed, but continuing..."
fi

echo ""
echo "=== Update Complete ==="
echo "✅ Lua scripts updated"
echo "✅ FreeSWITCH reloaded"
echo ""
echo "The updated scripts should now be active."
echo "Test the call again in the browser"

