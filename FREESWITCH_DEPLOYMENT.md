# FreeSWITCH Deployment Anleitung

## 📋 Schnellübersicht

**Problem:** Status zeigt "Nicht verbunden" im Dashboard

**Ursache:** FreeSWITCH läuft nicht auf `wss://aidevelo.ai:7443` in Production

**Lösung:** FreeSWITCH auf einem Server deployen und `FREESWITCH_WSS_URL` in Render setzen

---

## 🔍 Warum steht "Nicht verbunden"?

**Kurze Antwort:** FreeSWITCH läuft nicht auf `wss://aidevelo.ai:7443` in Production.

**Detaillierte Erklärung:**

1. **Lokale Entwicklung:** FreeSWITCH läuft nur, wenn Sie `docker-compose up freeswitch` lokal ausführen
2. **Production:** FreeSWITCH ist noch nicht auf einem öffentlichen Server deployed
3. **WebSocket-Verbindung:** Der Browser versucht, sich mit `wss://aidevelo.ai:7443` zu verbinden, aber dieser Server existiert nicht

---

## 🚀 FreeSWITCH Deployment - Schritt für Schritt

### Option 1: Lokale Entwicklung (Schnelltest)

**Für lokale Tests:**

```bash
# 1. FreeSWITCH Container starten
docker-compose up -d freeswitch

# 2. Prüfen ob FreeSWITCH läuft
docker logs aidevelo-freeswitch

# 3. Status prüfen
docker exec aidevelo-freeswitch fs_cli -x "status"

# 4. Frontend starten (in separatem Terminal)
npm run dev

# 5. Im Browser: http://localhost:4000/dashboard/test-call
# 6. Klicke auf "Mit FreeSWITCH verbinden"
```

**Erwartetes Ergebnis:**
- Status: "Verbunden" (grün)
- Button: "Test Call starten" wird aktiv

---

### Option 2: Production Deployment auf Render

**Schritt 1: FreeSWITCH als separaten Service auf Render deployen**

1. **Gehe zu Render Dashboard:** https://dashboard.render.com
2. **Neuer Web Service erstellen:**
   - Name: `aidevelo-freeswitch`
   - Environment: Docker
   - Dockerfile: Erstelle eine `Dockerfile` für FreeSWITCH (siehe unten)

3. **Dockerfile für Render erstellen:**

```dockerfile
# infra/freeswitch/Dockerfile.render
FROM signalwire/freeswitch:latest

# Kopiere Konfiguration
COPY infra/freeswitch/dialplan /etc/freeswitch/dialplan/default
COPY infra/freeswitch/vars.xml /etc/freeswitch/vars.xml
COPY infra/freeswitch/scripts /usr/share/freeswitch/scripts

# Exponiere Ports
EXPOSE 5060/udp 5060/tcp 7443/tcp 8080/tcp 8021/tcp

# Starte FreeSWITCH
CMD ["freeswitch", "-nonat"]
```

4. **Render Environment Variables setzen:**

```
FS_EVENT_SOCKET=0.0.0.0:8021
FS_EVENT_SOCKET_PASSWORD=ClueCon
BACKEND_URL=https://real-aidevelo-ai.onrender.com
```

5. **Ports konfigurieren:**
   - Port 7443: Öffentlich exponiert
   - Port 5060: Öffentlich exponiert (SIP)
   - Port 8021: Nur intern (ESL)

6. **Nach Deployment:**
   - Render gibt eine URL wie: `https://aidevelo-freeswitch.onrender.com`
   - **WICHTIG:** Render unterstützt keine benutzerdefinierten Ports in der URL
   - **Lösung:** Verwende einen Reverse Proxy oder einen anderen Hosting-Provider

---

### Option 3: Production Deployment auf Railway (Empfohlen)

**Railway unterstützt benutzerdefinierte Ports besser:**

1. **Gehe zu Railway:** https://railway.app
2. **Neues Projekt erstellen**
3. **Docker Service hinzufügen:**
   - Repository: Dein GitHub Repo
   - Dockerfile: `infra/freeswitch/Dockerfile.railway` (siehe unten)
   - Port: 7443

4. **Dockerfile für Railway:**

```dockerfile
# infra/freeswitch/Dockerfile.railway
FROM signalwire/freeswitch:latest

# Kopiere Konfiguration
COPY infra/freeswitch/dialplan /etc/freeswitch/dialplan/default
COPY infra/freeswitch/vars.xml /etc/freeswitch/vars.xml
COPY infra/freeswitch/scripts /usr/share/freeswitch/scripts

# Exponiere Ports
EXPOSE 5060/udp 5060/tcp 7443/tcp 8080/tcp 8021/tcp

# Starte FreeSWITCH
CMD ["freeswitch", "-nonat"]
```

5. **Railway Environment Variables:**

```
FS_EVENT_SOCKET=0.0.0.0:8021
FS_EVENT_SOCKET_PASSWORD=ClueCon
BACKEND_URL=https://real-aidevelo-ai.onrender.com
```

6. **Nach Deployment:**
   - Railway gibt eine URL: `https://aidevelo-freeswitch.up.railway.app`
   - **Problem:** Railway verwendet HTTPS, aber FreeSWITCH braucht WSS auf Port 7443
   - **Lösung:** Verwende einen Reverse Proxy (siehe Option 4)

---

### Option 4: Production Deployment mit eigenem VPS (Beste Lösung)

**Für Production empfohlen:**

1. **VPS mieten** (z.B. DigitalOcean, Hetzner, Contabo):
   - Mindestens 2GB RAM
   - Ubuntu 22.04 LTS
   - Öffentliche IP-Adresse

2. **SSH auf Server:**

```bash
ssh root@YOUR_SERVER_IP
```

3. **Docker installieren:**

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
apt-get install docker-compose-plugin
```

4. **FreeSWITCH deployen:**

```bash
# Projekt klonen
git clone https://github.com/keokukzh/REAL-AIDevelo.ai.git
cd REAL-AIDevelo.ai

# Nur FreeSWITCH starten
docker-compose up -d freeswitch

# Firewall konfigurieren
ufw allow 5060/udp
ufw allow 5060/tcp
ufw allow 7443/tcp
ufw allow 8080/tcp
ufw enable
```

5. **Domain konfigurieren (optional):**

```bash
# DNS A-Record setzen:
# freeswitch.aidevelo.ai -> YOUR_SERVER_IP
```

6. **SSL-Zertifikat für WSS (wichtig!):**

```bash
# Certbot installieren
apt-get install certbot

# Zertifikat für freeswitch.aidevelo.ai erstellen
certbot certonly --standalone -d freeswitch.aidevelo.ai

# FreeSWITCH mit SSL konfigurieren (siehe FreeSWITCH SSL Setup)
```

7. **Backend Environment Variable setzen:**

In Render Environment Variables:
```
FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai:7443
```

---

### Option 5: Cloudflare Tunnel (Einfachste Lösung für Production)

**Verwende Cloudflare Tunnel, um FreeSWITCH sicher zu exposen:**

1. **Cloudflare Tunnel installieren:**

```bash
# Auf dem VPS oder lokalen Server
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
```

2. **Tunnel erstellen:**

```bash
cloudflared tunnel login
cloudflared tunnel create aidevelo-freeswitch
```

3. **Tunnel konfigurieren:**

Erstelle `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    service: tcp://localhost:7443
  - service: http_status:404
```

4. **Tunnel starten:**

```bash
cloudflared tunnel run aidevelo-freeswitch
```

5. **DNS konfigurieren:**

In Cloudflare Dashboard:
- CNAME: `freeswitch.aidevelo.ai` -> `YOUR_TUNNEL_ID.cfargotunnel.com`

6. **Backend Environment Variable:**

```
FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai
```

**Vorteil:** Keine Firewall-Regeln, automatisches SSL, funktioniert hinter NAT

---

## 🔧 Backend-Konfiguration aktualisieren

**Nach FreeSWITCH Deployment:**

1. **Render Environment Variables setzen:**

```
FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai:7443
# oder mit Cloudflare Tunnel:
FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai
```

2. **Backend neu deployen** (Render deployt automatisch nach Git Push)

3. **Testen:**

```bash
# Prüfe ob Endpoint funktioniert
curl https://real-aidevelo-ai.onrender.com/api/v1/test-call/config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Erwartete Antwort:**
```json
{
  "success": true,
  "config": {
    "wss_url": "wss://freeswitch.aidevelo.ai:7443",
    "sip_username": "test_...",
    "sip_password": "test123",
    "extension": "1000"
  }
}
```

---

## ✅ Checkliste: FreeSWITCH Deployment

- [ ] FreeSWITCH läuft auf einem Server (VPS/Railway/Render)
- [ ] Port 7443 ist öffentlich erreichbar
- [ ] SSL-Zertifikat für WSS konfiguriert (oder Cloudflare Tunnel)
- [ ] `FREESWITCH_WSS_URL` in Render Environment Variables gesetzt
- [ ] Backend neu deployed
- [ ] `/api/v1/test-call/config` gibt korrekte URL zurück
- [ ] Browser kann WebSocket-Verbindung herstellen
- [ ] Status zeigt "Verbunden" im Dashboard

---

## 🐛 Troubleshooting

### Problem: "WebSocket closed (code: 1006)"

**Ursachen:**
1. FreeSWITCH läuft nicht
2. Port 7443 ist nicht erreichbar
3. Firewall blockiert Port
4. SSL-Zertifikat fehlt oder ist ungültig

**Lösung:**
```bash
# Prüfe ob FreeSWITCH läuft
docker ps | grep freeswitch

# Prüfe Ports
netstat -tulpn | grep 7443

# Prüfe Firewall
ufw status

# Teste WebSocket-Verbindung
wscat -c wss://freeswitch.aidevelo.ai:7443
```

### Problem: "Connection timeout"

**Ursachen:**
1. FreeSWITCH antwortet nicht
2. Netzwerk-Problem
3. Falsche URL konfiguriert

**Lösung:**
```bash
# Prüfe FreeSWITCH Logs
docker logs aidevelo-freeswitch

# Prüfe ob FreeSWITCH auf Port 7443 hört
docker exec aidevelo-freeswitch netstat -tulpn | grep 7443

# Teste von außen
curl -v https://freeswitch.aidevelo.ai:7443
```

### Problem: "Backend 503 Service Unavailable"

**Ursachen:**
1. Render Backend ist im Hibernate-Modus
2. Backend ist überlastet
3. Backend crashed

**Lösung:**
1. Warte 30 Sekunden (Render weckt sich auf)
2. Prüfe Render Logs
3. Prüfe Backend Health: `https://real-aidevelo-ai.onrender.com/health`

---

## 📝 Nächste Schritte

1. **Wähle eine Deployment-Option** (empfohlen: Option 4 oder 5)
2. **Deploye FreeSWITCH** auf einem Server
3. **Setze `FREESWITCH_WSS_URL`** in Render Environment Variables
4. **Teste die Verbindung** im Dashboard

**Für sofortige Tests:** Verwende Option 1 (lokale Entwicklung) mit `docker-compose up freeswitch`

