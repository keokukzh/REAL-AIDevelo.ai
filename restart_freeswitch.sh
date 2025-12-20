#!/bin/bash
# Restart FreeSWITCH with new WebSocket configuration

echo "=== Restarting FreeSWITCH ==="
cd ~/REAL-AIDevelo.ai
git pull

echo ""
echo "Restarting FreeSWITCH container..."
docker-compose restart freeswitch

echo ""
echo "Waiting for FreeSWITCH to start..."
sleep 10

echo ""
echo "Checking FreeSWITCH logs for WebSocket configuration:"
docker logs aidevelo-freeswitch --tail 50 | grep -i -E "(websocket|sofia|internal|wss-binding|ws-binding|profile)" || echo "No WebSocket-related logs found"

echo ""
echo "Checking if FreeSWITCH is running:"
docker ps | grep freeswitch

echo ""
echo "=== Restart Complete ==="

