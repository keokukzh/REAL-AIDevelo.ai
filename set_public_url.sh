#!/bin/bash
# Set PUBLIC_BASE_URL in FreeSWITCH container
# Run this on the Hetzner server

set -e

echo "=== Setting PUBLIC_BASE_URL in FreeSWITCH ==="
echo ""

# Get project directory
PROJECT_DIR="$HOME/REAL-AIDevelo.ai"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="/root/REAL-AIDevelo.ai"
fi

cd "$PROJECT_DIR"

# Set PUBLIC_BASE_URL
PUBLIC_URL="${1:-https://real-aidevelo-ai.onrender.com}"
echo "Setting PUBLIC_BASE_URL=$PUBLIC_URL"
echo ""

# Create/update .env file
echo "1. Creating/updating .env file..."
if [ -f .env ]; then
    # Remove old PUBLIC_BASE_URL if exists
    sed -i '/^PUBLIC_BASE_URL=/d' .env
fi

# Add PUBLIC_BASE_URL to .env
echo "PUBLIC_BASE_URL=$PUBLIC_URL" >> .env
echo "✅ .env file updated"
echo ""

# Show .env content
echo "Current .env content:"
cat .env | grep PUBLIC_BASE_URL || echo "⚠️  PUBLIC_BASE_URL not found in .env"
echo ""

# Restart FreeSWITCH with new environment
echo "2. Restarting FreeSWITCH..."
docker compose down freeswitch 2>/dev/null || docker stop aidevelo-freeswitch 2>/dev/null || true
sleep 2

# Start with .env file (docker-compose reads .env automatically)
docker compose up -d freeswitch
sleep 5
echo ""

# Verify environment variable
echo "3. Verifying PUBLIC_BASE_URL in container..."
if docker exec aidevelo-freeswitch env | grep -q "PUBLIC_BASE_URL=$PUBLIC_URL"; then
    echo "✅ PUBLIC_BASE_URL is set correctly!"
    docker exec aidevelo-freeswitch env | grep PUBLIC_BASE_URL
else
    echo "⚠️  PUBLIC_BASE_URL not found in container"
    echo "Trying to set it manually..."
    # Try to set it via docker exec (temporary)
    docker exec aidevelo-freeswitch sh -c "export PUBLIC_BASE_URL=$PUBLIC_URL" || true
fi
echo ""

# Check FreeSWITCH status
echo "4. FreeSWITCH Status:"
docker ps | grep freeswitch || echo "⚠️  FreeSWITCH not running"
echo ""

echo "=== Complete ==="
echo ""
echo "PUBLIC_BASE_URL is now: $PUBLIC_URL"
echo "FreeSWITCH should use this URL to reach the backend"
echo ""

