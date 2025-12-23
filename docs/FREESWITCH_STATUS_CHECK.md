# FreeSWITCH Status Check - Anleitung

## Automatischer Status-Check

Ein verbessertes Check-Script wurde erstellt: `scripts/check_freeswitch_status.sh`

### Auf Hetzner Server ausführen:

```bash
ssh root@91.99.202.18
cd ~/REAL-AIDevelo.ai
chmod +x scripts/check_freeswitch_status.sh
./scripts/check_freeswitch_status.sh
```

### Was das Script prüft:

1. ✅ **FreeSWITCH Container** - Läuft der Container?
2. ✅ **Port 7443** - Ist der Port offen?
3. ✅ **FreeSWITCH Status** - Antwortet FreeSWITCH auf Status-Check?
4. ✅ **Cloudflare Tunnel** - Läuft der Tunnel-Service?
5. ✅ **DNS Resolution** - Löst `freeswitch.aidevelo.ai` korrekt auf?
6. ✅ **Environment Variables** - Ist PUBLIC_BASE_URL gesetzt?
7. ✅ **Recent Logs** - Zeigt die letzten Log-Einträge

### Erwartetes Ergebnis:

Wenn alles OK:
```
✅ All checks passed! FreeSWITCH should be ready.
```

Wenn Probleme:
```
❌ Some checks failed. Please review above.
```

## Manuelle Prüfung

### 1. FreeSWITCH Container Status

```bash
docker ps | grep freeswitch
```

**Erwartet:** Container mit Status "Up"

### 2. FreeSWITCH Port

```bash
netstat -tulpn | grep 7443
# oder
ss -tulpn | grep 7443
```

**Erwartet:** Port 7443 im LISTEN-Status

### 3. FreeSWITCH Status

```bash
docker exec aidevelo-freeswitch fs_cli -x "status"
```

**Erwartet:** "UP" Status

### 4. Cloudflare Tunnel

```bash
systemctl status cloudflared
```

**Erwartet:** "active (running)"

### 5. DNS Resolution

```bash
nslookup freeswitch.aidevelo.ai
```

**Erwartet:** IP-Adresse oder CNAME zu Tunnel

### 6. Render Environment Variable

**Prüfen in Render Dashboard:**
- Service: `real-aidevelo-ai`
- Environment Variables
- `FREESWITCH_WSS_URL` sollte sein: `wss://freeswitch.aidevelo.ai` (OHNE Port!)

## FreeSWITCH starten (falls nicht läuft)

```bash
ssh root@91.99.202.18
cd ~/REAL-AIDevelo.ai
docker compose up -d freeswitch
sleep 30
docker ps | grep freeswitch
docker logs aidevelo-freeswitch --tail 20
```

## Cloudflare Tunnel starten (falls nicht läuft)

```bash
systemctl start cloudflared
systemctl status cloudflared
```

## Test im Browser

Nach erfolgreichem Status-Check:

1. Gehe zu: https://aidevelo.ai/dashboard/test-call
2. Klicke: "Mit FreeSWITCH verbinden"
3. Status sollte sein: "Verbunden" (grün) ✅

## Troubleshooting

### Problem: Container läuft nicht
**Lösung:** `docker compose up -d freeswitch`

### Problem: Port 7443 nicht offen
**Lösung:** Prüfe Docker-Compose Konfiguration, Container neu starten

### Problem: FreeSWITCH antwortet nicht
**Lösung:** Prüfe Logs: `docker logs aidevelo-freeswitch --tail 50`

### Problem: Cloudflare Tunnel läuft nicht
**Lösung:** `systemctl start cloudflared` und prüfe Konfiguration

### Problem: DNS löst nicht auf
**Lösung:** Prüfe Cloudflare DNS-Einstellungen, CNAME sollte auf Tunnel zeigen

### Problem: Verbindung im Browser schlägt fehl
**Lösung:** 
- Prüfe `FREESWITCH_WSS_URL` in Render (sollte OHNE Port sein)
- Prüfe Browser Console für Fehler
- Prüfe CSP (Content Security Policy) Einstellungen

