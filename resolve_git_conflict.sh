#!/bin/bash
# Resolve git conflict and run fix script
# Run this on the Hetzner server

cd ~/REAL-AIDevelo.ai

echo "=== Resolving Git Conflict ==="
echo ""

# Stash local changes
echo "1. Stashing local changes..."
git stash
echo ""

# Pull latest changes
echo "2. Pulling latest changes..."
git pull
echo ""

# Run fix script
echo "3. Running fix script..."
chmod +x fix_freeswitch_dialplan.sh
./fix_freeswitch_dialplan.sh

