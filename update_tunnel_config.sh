#!/bin/bash
cat > ~/.cloudflared/config.yml <<'EOF'
tunnel: c7580385-88ce-474b-b8bd-9bea4d52b296
credentials-file: /root/.cloudflared/c7580385-88ce-474b-b8bd-9bea4d52b296.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    service: http://localhost:8082
  - service: http_status:404
EOF

systemctl restart cloudflared
sleep 3
systemctl status cloudflared --no-pager | head -10

