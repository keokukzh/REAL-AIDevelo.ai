# FreeSWITCH WSS Problem - Detaillierte Analyse

## Problem
**FreeSWITCH lauscht NICHT auf Port 7443 für WSS (WebSocket Secure)**

## Was wir wissen:

### ✅ Was funktioniert:
1. **Zertifikat erstellt**: `wss.pem` existiert in `/usr/local/freeswitch/certs/`
2. **Konfiguration korrekt**: `wss-binding` ist in `internal.xml` auf `:7443` gesetzt
3. **Nginx läuft**: Port 8082 → leitet zu FreeSWITCH 7443 weiter
4. **Cloudflare Tunnel läuft**: `freeswitch.aidevelo.ai` → `http://localhost:8082`

### ❌ Was NICHT funktioniert:
1. **Port 7443 lauscht NICHT**: FreeSWITCH bindet nicht auf Port 7443
2. **WebSocket Handshake schlägt fehl**: `Sec-WebSocket-Protocol` Header wird nicht beantwortet

## Mögliche Ursachen:

### 1. FreeSWITCH Profil wird nicht geladen
- Das `internal` Profil muss explizit gestartet werden
- FreeSWITCH lädt Profile nicht automatisch beim Start

### 2. WSS-Binding benötigt explizite Aktivierung
- `wss-binding` allein reicht nicht
- Profil muss mit `sofia profile internal start` gestartet werden

### 3. ESL (Event Socket Library) nicht konfiguriert
- `fs_cli` kann nicht verbinden → Profil kann nicht gestartet werden
- ESL Port 8021 muss erreichbar sein

### 4. Cloudflare Tunnel WebSocket Problem
- Cloudflare Tunnel unterstützt WebSocket, ABER:
- **WICHTIG**: Cloudflare Tunnel mit `http://` Service unterstützt WebSocket-Upgrades
- **ABER**: FreeSWITCH muss auf HTTP/WebSocket lauschen, nicht nur auf WSS

## Lösung - Schritt für Schritt:

### Schritt 1: Prüfe ob ESL funktioniert
```bash
docker exec aidevelo-freeswitch fs_cli -x 'status'
```

### Schritt 2: Starte internes Profil manuell
```bash
docker exec aidevelo-freeswitch fs_cli -x 'sofia profile internal start'
```

### Schritt 3: Prüfe ob Port 7443 jetzt lauscht
```bash
docker exec aidevelo-freeswitch netstat -tulpn | grep 7443
```

### Schritt 4: Teste WebSocket direkt
```bash
curl -v -H 'Upgrade: websocket' -H 'Connection: Upgrade' http://localhost:7443/
```

## Alternative: FreeSWITCH über HTTP statt WSS

Wenn WSS nicht funktioniert, können wir:
1. **WS (nicht WSS) verwenden**: Port 5066 statt 7443
2. **Nginx terminiert SSL**: Nginx macht HTTPS → FreeSWITCH bekommt HTTP/WS
3. **Cloudflare Tunnel**: Macht HTTPS → Nginx → FreeSWITCH WS

## Nächste Schritte:
1. Prüfe ESL Konfiguration
2. Starte internes Profil manuell
3. Prüfe ob Port 7443 jetzt lauscht
4. Falls nicht: Verwende WS (Port 5066) statt WSS (Port 7443)

