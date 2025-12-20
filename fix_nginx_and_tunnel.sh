#!/bin/bash
# Fix Nginx and Cloudflare Tunnel config
# Run on server

# Update Nginx config
cd ~/REAL-AIDevelo.ai
git pull
cat infra/nginx/nginx.conf > /etc/nginx/nginx.conf
nginx -t
systemctl restart nginx
systemctl status nginx --no-pager | head -10

# Update Cloudflare Tunnel config
cat > ~/.cloudflared/config.yml <<'EOF'
tunnel: c7580385-88ce-474b-b8bd-9bea4d52b296
credentials-file: /root/.cloudflared/c7580385-88ce-474b-b8bd-9bea4d52b296.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    service: http://localhost:8082
  - service: http_status:404
EOF

# Restart Cloudflare Tunnel
systemctl restart cloudflared
sleep 3
systemctl status cloudflared --no-pager | head -10

echo ""
echo "✅ Nginx and Cloudflare Tunnel updated!"
echo "Nginx: Port 8082"
echo "Tunnel: http://localhost:8082"

