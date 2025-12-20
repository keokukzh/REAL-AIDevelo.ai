#!/bin/bash
# Diagnostic script to check WebSocket connection setup
# Run this on the Hetzner server

echo "=== WebSocket Connection Diagnostics ==="
echo ""

# 1. Check Nginx status
echo "1. Nginx Status:"
systemctl status nginx --no-pager | head -5
echo ""

# 2. Check if Nginx is listening on 8082
echo "2. Nginx listening on port 8082:"
netstat -tulpn | grep 8082 || ss -tulpn | grep 8082
echo ""

# 3. Check Nginx config
echo "3. Nginx config (proxy_pass):"
grep -A 5 "proxy_pass" /etc/nginx/nginx.conf | head -10
echo ""

# 4. Check Cloudflare Tunnel status
echo "4. Cloudflare Tunnel Status:"
systemctl status cloudflared --no-pager | head -5
echo ""

# 5. Check Cloudflare Tunnel config
echo "5. Cloudflare Tunnel config:"
cat /etc/cloudflared/config.yml
echo ""

# 6. Check FreeSWITCH status
echo "6. FreeSWITCH Container:"
docker ps | grep freeswitch
echo ""

# 7. Check FreeSWITCH internal profile
echo "7. FreeSWITCH Internal Profile:"
docker exec aidevelo-freeswitch fs_cli -x "sofia status profile internal" 2>/dev/null | head -10
echo ""

# 8. Test Nginx proxy to FreeSWITCH
echo "8. Testing Nginx proxy (HTTP):"
curl -v -H 'Upgrade: websocket' -H 'Connection: Upgrade' \
  -H 'Sec-WebSocket-Key: test' -H 'Sec-WebSocket-Version: 13' \
  http://localhost:8082/ 2>&1 | head -20
echo ""

# 9. Test direct FreeSWITCH WSS
echo "9. Testing direct FreeSWITCH WSS (from server):"
timeout 5 openssl s_client -connect 127.0.0.1:7443 -quiet 2>&1 | head -5 || echo "Connection test completed"
echo ""

# 10. Check recent Nginx logs
echo "10. Recent Nginx access logs:"
tail -5 /var/log/nginx/access.log 2>/dev/null || echo "No access log found"
echo ""

# 11. Check recent Nginx error logs
echo "11. Recent Nginx error logs:"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No error log found"
echo ""

# 12. Check Cloudflare Tunnel logs
echo "12. Recent Cloudflare Tunnel logs:"
journalctl -u cloudflared -n 10 --no-pager | tail -10
echo ""

echo "=== Diagnostics Complete ==="
echo ""
echo "Key things to check:"
echo "- Nginx should be listening on port 8082"
echo "- Nginx should proxy_pass to https://freeswitch (127.0.0.1:7443)"
echo "- Cloudflare Tunnel should forward to http://localhost:8082"
echo "- FreeSWITCH internal profile should be RUNNING"
echo ""

