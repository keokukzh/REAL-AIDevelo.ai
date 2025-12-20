# 🔧 WebSocket Verbindungsfehler - Troubleshooting

## Problem

**Fehler:** "FreeSWITCH server is not reachable"

**Status:**
- ✅ FreeSWITCH läuft auf Server (Port 7443)
- ✅ Cloudflare Tunnel läuft
- ✅ DNS löst auf (`freeswitch.aidevelo.ai`)
- ✅ Backend gibt korrekte URL zurück (`wss://freeswitch.aidevelo.ai`)
- ❌ WebSocket-Verbindung schlägt fehl

## Mögliche Ursachen

### 1. Cloudflare Tunnel unterstützt WebSocket-Upgrades nicht korrekt

**Problem:** Cloudflare Tunnel mit `tcp://localhost:7443` unterstützt möglicherweise keine WebSocket-Upgrades.

**Lösung:** Tunnel-Konfiguration anpassen:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    originRequest:
      noHappyEyeballs: false
      tcpKeepAlive: 30s
      keepAliveConnections: 100
      keepAliveTimeout: 90s
    service: tcp://localhost:7443
  - service: http_status:404
```

**Auf Server ausführen:**
```bash
# Config anpassen
nano ~/.cloudflared/config.yml
# (oben stehende Config einfügen)

# Tunnel neu starten
systemctl restart cloudflared
```

### 2. FreeSWITCH WSS erwartet spezielle Headers

**Problem:** FreeSWITCH könnte spezielle WebSocket-Upgrade-Headers benötigen.

**Lösung:** Prüfen Sie FreeSWITCH Logs:
```bash
docker logs aidevelo-freeswitch --tail 50 | grep -i websocket
```

### 3. Cloudflare Tunnel Route nicht korrekt

**Problem:** Tunnel leitet nicht korrekt weiter.

**Lösung:** Prüfen Sie Tunnel-Logs:
```bash
journalctl -u cloudflared -f
```

### 4. Browser CSP blockiert Verbindung

**Problem:** Content Security Policy blockiert WebSocket.

**Status:** ✅ Bereits behoben (CSP erlaubt `wss://freeswitch.aidevelo.ai`)

## Debugging-Schritte

### Schritt 1: Prüfe Tunnel-Konfiguration

**Auf Server:**
```bash
cat ~/.cloudflared/config.yml
```

**Sollte enthalten:**
- `hostname: freeswitch.aidevelo.ai`
- `service: tcp://localhost:7443`
- Optional: `originRequest` für WebSocket-Support

### Schritt 2: Prüfe Tunnel-Logs

**Auf Server:**
```bash
journalctl -u cloudflared -n 50 --no-pager
```

**Suche nach:**
- `Registered tunnel connection` (gut)
- `error` oder `failed` (schlecht)

### Schritt 3: Teste direkte Verbindung

**Von Server:**
```bash
# Teste ob FreeSWITCH lokal erreichbar ist
curl -v http://localhost:7443
# Oder
telnet localhost 7443
```

### Schritt 4: Prüfe Browser Console

**Im Browser (F12 → Console):**
- Suche nach WebSocket-Fehlern
- Prüfe Network-Tab für WebSocket-Verbindung
- Status-Code sollte nicht 502/503 sein

## Alternative Lösung: Direkter Port-Forward

**Falls Cloudflare Tunnel nicht funktioniert:**

1. **Firewall öffnen** (auf Hetzner Server):
```bash
ufw allow 7443/tcp
```

2. **Backend URL ändern:**
```
FREESWITCH_WSS_URL=wss://91.99.202.18:7443
```

3. **SSL-Zertifikat für FreeSWITCH konfigurieren** (für WSS)

**Nachteil:** Direkter Zugriff ohne Cloudflare-Schutz

## Empfohlene Lösung

**Option 1: Cloudflare Tunnel mit originRequest** (siehe oben)

**Option 2: FreeSWITCH auf HTTP/HTTPS-Port**
- FreeSWITCH kann auch auf Port 443/80 laufen
- Cloudflare Tunnel leitet dann HTTP/HTTPS weiter
- WebSocket-Upgrade funktioniert über HTTP

**Option 3: Alternative WebSocket-Proxy**
- Nginx als Reverse-Proxy vor FreeSWITCH
- Nginx handhabt WebSocket-Upgrades
- Cloudflare Tunnel leitet zu Nginx

## Nächste Schritte

1. ✅ Prüfe Tunnel-Konfiguration (siehe oben)
2. ⏳ Passe Config an (falls nötig)
3. ⏳ Restart Tunnel
4. ⏳ Teste erneut im Dashboard

