# WebSocket 1006 Error Fix - Deployment Guide

## Problem Summary

The WebSocket connection was failing with error code 1006 because:
- Cloudflare Tunnel was using TCP forwarding (`tcp://localhost:7443`) which cannot handle HTTP WebSocket upgrade handshakes
- Nginx configuration referenced a non-existent `websocket-proxy` upstream

## Solution

Changed architecture to use HTTP forwarding through Nginx, which properly handles WebSocket upgrades:

```
Browser (wss://freeswitch.aidevelo.ai)
  → Cloudflare Tunnel (HTTPS termination)
    → Nginx (http://localhost:8082) - WebSocket upgrade handler
      → FreeSWITCH (https://127.0.0.1:7443) - WSS endpoint
```

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. **SSH to the Hetzner server:**
   ```bash
   ssh root@91.99.202.18
   ```

2. **Navigate to project directory:**
   ```bash
   cd ~/REAL-AIDevelo.ai
   ```

3. **Pull latest changes:**
   ```bash
   git pull
   ```

4. **Make deployment script executable:**
   ```bash
   chmod +x deploy_websocket_fix.sh
   ```

5. **Run the deployment script:**
   ```bash
   ./deploy_websocket_fix.sh
   ```

   This script will:
   - Update Nginx configuration
   - Restart Nginx
   - Update Cloudflare Tunnel configuration
   - Restart Cloudflare Tunnel
   - Verify FreeSWITCH WSS is running

6. **Wait 30 seconds** for services to fully restart

7. **Test the connection:**
   - Go to: `https://aidevelo.ai/dashboard/test-call`
   - Click "Mit FreeSWITCH verbinden"
   - Connection should succeed

### Option 2: Manual Deployment

If you prefer to run steps individually:

1. **Update Nginx config:**
   ```bash
   cp infra/nginx/nginx.conf /etc/nginx/nginx.conf
   nginx -t
   systemctl restart nginx
   ```

2. **Update Cloudflare Tunnel config:**
   ```bash
   chmod +x update_tunnel_to_http.sh
   ./update_tunnel_to_http.sh
   ```

3. **Verify FreeSWITCH WSS:**
   ```bash
   chmod +x verify_freeswitch_wss.sh
   ./verify_freeswitch_wss.sh
   ```

## What Changed

### 1. Nginx Configuration (`infra/nginx/nginx.conf`)
- **Before:** Referenced non-existent `websocket-proxy` upstream
- **After:** Proxies directly to FreeSWITCH WSS (`https://127.0.0.1:7443`) with proper SSL settings

### 2. Cloudflare Tunnel Configuration (`/etc/cloudflared/config.yml`)
- **Before:** `service: tcp://localhost:7443` (TCP forwarding, no WebSocket upgrade support)
- **After:** `service: http://localhost:8082` (HTTP forwarding, proper WebSocket upgrade support)

### 3. FreeSWITCH WSS Binding
- Verified internal profile is started
- WSS binding on port 7443 is active

## Verification

After deployment, verify everything is working:

```bash
# Check Nginx
systemctl status nginx

# Check Cloudflare Tunnel
systemctl status cloudflared

# Check FreeSWITCH
docker ps | grep freeswitch
docker exec aidevelo-freeswitch fs_cli -x "sofia status profile internal"

# Check Nginx is listening on 8082
netstat -tulpn | grep 8082
```

## Troubleshooting

If the connection still fails:

1. **Check Nginx logs:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

2. **Check Cloudflare Tunnel logs:**
   ```bash
   journalctl -u cloudflared -f
   ```

3. **Check FreeSWITCH logs:**
   ```bash
   docker logs aidevelo-freeswitch --tail 50 | grep -i websocket
   ```

4. **Test Nginx proxy locally:**
   ```bash
   curl -v -H 'Upgrade: websocket' -H 'Connection: Upgrade' http://localhost:8082/
   ```

5. **Test FreeSWITCH WSS directly:**
   ```bash
   docker exec aidevelo-freeswitch fs_cli -x "sofia status profile internal"
   ```

## Expected Result

After successful deployment:
- WebSocket connection should succeed
- No more error code 1006
- Connection status should show "Verbunden" (Connected)
- Test call functionality should work

