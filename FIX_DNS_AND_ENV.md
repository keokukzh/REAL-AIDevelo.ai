# Fix DNS und Environment Variable

## Problem 1: Render Environment Variable
**Aktuell:** `FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai:7443`  
**Sollte sein:** `FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai` (ohne Port)

**Grund:** Cloudflare Tunnel terminiert SSL und leitet HTTP an Nginx weiter. Der Port wird von Cloudflare gehandhabt, nicht vom Browser.

## Problem 2: Cloudflare DNS "DNS only"
**Aktuell:** `freeswitch.aidevelo.ai` → `91.99.202.18` (A-Record, DNS only)  
**Sollte sein:** CNAME zu Cloudflare Tunnel Hostname ODER A-Record auf "Proxied"

**Grund:** "DNS only" bedeutet, dass der Browser direkt zur IP verbindet, nicht über Cloudflare Tunnel. Das führt zu:
- CSP-Fehlern (IP-Adressen werden blockiert)
- Keine SSL-Terminierung durch Cloudflare
- Nginx auf Port 8082 wird nicht erreicht

## Lösung:

### Schritt 1: Render Environment Variable ändern
1. Gehe zu Render Dashboard → Environment Variables
2. Ändere `FREESWITCH_WSS_URL` von `wss://freeswitch.aidevelo.ai:7443` zu `wss://freeswitch.aidevelo.ai`
3. Speichern und Service neu deployen

### Schritt 2: Cloudflare DNS ändern
**Option A: CNAME zu Cloudflare Tunnel (EMPFOHLEN)**
1. Lösche den A-Record `freeswitch.aidevelo.ai` → `91.99.202.18`
2. Erstelle CNAME: `freeswitch` → `{tunnel-id}.cfargotunnel.com`
   - Tunnel-ID findest du in `~/.cloudflared/config.yml` auf dem Server
3. Setze Proxy-Status auf "Proxied" (orange Wolke)

**Option B: A-Record auf "Proxied" setzen**
1. Bearbeite den A-Record `freeswitch.aidevelo.ai`
2. Ändere Proxy-Status von "DNS only" zu "Proxied" (orange Wolke)
3. **WICHTIG:** Cloudflare Tunnel muss trotzdem konfiguriert sein, um HTTP/WebSocket an Nginx weiterzuleiten

## Nach Änderungen:
1. Warte 1-2 Minuten (DNS Propagation)
2. Teste im Dashboard: https://aidevelo.ai/dashboard/test-call
3. Klicke "Mit FreeSWITCH verbinden"

