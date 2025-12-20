#!/bin/bash
# Setup Nginx as WebSocket proxy for FreeSWITCH
# Run this on the Hetzner server

set -e

echo "=== Setting up Nginx WebSocket Proxy ==="
echo ""

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get update
    apt-get install -y nginx
fi

echo "✅ Nginx installed: $(nginx -v 2>&1)"
echo ""

# Create Nginx config directory
mkdir -p /etc/nginx/conf.d

# Copy config
if [ -f "infra/nginx/nginx.conf" ]; then
    cp infra/nginx/nginx.conf /etc/nginx/nginx.conf
    echo "✅ Nginx config copied"
else
    echo "Creating Nginx config..."
    cat > /etc/nginx/nginx.conf <<'EOF'
events {
    worker_connections 1024;
}

http {
    upstream freeswitch {
        server localhost:7443;
    }

    server {
        listen 8082;  # Changed from 8080 (FreeSWITCH uses it)
        server_name freeswitch.aidevelo.ai;

        location / {
            proxy_pass http://freeswitch;
            proxy_http_version 1.1;
            
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_read_timeout 3600s;
            proxy_send_timeout 3600s;
        }
    }
}
EOF
    echo "✅ Nginx config created"
fi

# Test config
echo "Testing Nginx config..."
nginx -t

# Start/restart Nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo "✅ Nginx started"
echo ""

# Update Cloudflare Tunnel config
echo "Updating Cloudflare Tunnel config..."
cat > ~/.cloudflared/config.yml <<'EOF'
tunnel: c7580385-88ce-474b-b8bd-9bea4d52b296
credentials-file: /root/.cloudflared/c7580385-88ce-474b-b8bd-9bea4d52b296.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    service: http://localhost:8082
  - service: http_status:404
EOF

echo "✅ Cloudflare Tunnel config updated (now using HTTP instead of TCP)"
echo ""

# Restart Cloudflare Tunnel
echo "Restarting Cloudflare Tunnel..."
systemctl restart cloudflared
sleep 3

echo "✅ Cloudflare Tunnel restarted"
echo ""

echo "=== Setup Complete ==="
echo ""
echo "Nginx is now proxying HTTP/WebSocket to FreeSWITCH"
echo "Cloudflare Tunnel is configured to use HTTP (port 8080)"
echo ""
echo "Test in 30 seconds: https://aidevelo.ai/dashboard/test-call"

