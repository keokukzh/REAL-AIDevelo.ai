# Cloudflare Tunnel Setup für FreeSWITCH - Komplette Anleitung

## 🎯 Ziel

FreeSWITCH über Cloudflare Tunnel deployen, sodass es unter `wss://freeswitch.aidevelo.ai` erreichbar ist.

---

## 📋 Voraussetzungen

1. **Cloudflare-Konto** mit Domain `aidevelo.ai` verwaltet
2. **VPS/Server** (z.B. Hetzner, DigitalOcean) mit Ubuntu 22.04
3. **SSH-Zugang** zum Server

---

## 🚀 Schritt-für-Schritt Anleitung

### Schritt 1: VPS vorbereiten

**1.1 SSH auf Server verbinden:**

```bash
ssh root@IHR_SERVER_IP
```

**1.2 Docker installieren:**

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
apt-get install docker-compose-plugin -y

# Prüfen
docker --version
docker compose version
```

---

### Schritt 2: FreeSWITCH mit Docker starten

**2.1 Projekt auf Server klonen:**

```bash
# Projekt klonen
git clone https://github.com/keokukzh/REAL-AIDevelo.ai.git
cd REAL-AIDevelo.ai

# Nur FreeSWITCH starten (ohne andere Services)
docker compose up -d freeswitch

# Prüfen ob es läuft
docker ps | grep freeswitch
docker logs aidevelo-freeswitch
```

**2.2 FreeSWITCH testen:**

```bash
# Status prüfen
docker exec aidevelo-freeswitch fs_cli -x "status"

# Port prüfen
netstat -tulpn | grep 7443
```

**Erwartetes Ergebnis:** FreeSWITCH läuft auf `localhost:7443`

---

### Schritt 3: Cloudflare Tunnel installieren

**3.1 Cloudflared herunterladen:**

```bash
# Für Linux AMD64
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Prüfen
cloudflared --version
```

**3.2 Cloudflare Tunnel authentifizieren:**

```bash
# Login (öffnet Browser)
cloudflared tunnel login
```

**Wichtig:** 
- Browser öffnet sich automatisch
- Melden Sie sich bei Cloudflare an
- Wählen Sie Ihre Domain `aidevelo.ai`
- Klicken Sie auf "Authorize"

---

### Schritt 4: Tunnel erstellen

**4.1 Tunnel erstellen:**

```bash
cloudflared tunnel create aidevelo-freeswitch
```

**Ausgabe wird sein:**
```
Created tunnel aidevelo-freeswitch with id: XXXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

**WICHTIG:** Notieren Sie sich die Tunnel-ID (die lange UUID)!

**4.2 Tunnel-ID speichern:**

```bash
# Ersetzen Sie YOUR_TUNNEL_ID mit der echten ID
export TUNNEL_ID="YOUR_TUNNEL_ID"
echo $TUNNEL_ID
```

---

### Schritt 5: Tunnel konfigurieren

**5.1 Konfigurationsverzeichnis erstellen:**

```bash
mkdir -p ~/.cloudflared
```

**5.2 Konfigurationsdatei erstellen:**

```bash
nano ~/.cloudflared/config.yml
```

**5.3 Folgenden Inhalt einfügen:**

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    service: tcp://localhost:7443
  - service: http_status:404
```

**WICHTIG:** 
- Ersetzen Sie `YOUR_TUNNEL_ID` mit der echten Tunnel-ID (2x!)
- Speichern: `Ctrl+O`, dann `Enter`, dann `Ctrl+X`

**5.4 Prüfen:**

```bash
cat ~/.cloudflared/config.yml
```

---

### Schritt 6: DNS in Cloudflare konfigurieren

**6.1 Cloudflare Dashboard öffnen:**

1. Gehen Sie zu: https://dash.cloudflare.com
2. Wählen Sie Ihre Domain: `aidevelo.ai`
3. Klicken Sie auf **DNS** (links im Menü)

**6.2 CNAME-Eintrag hinzufügen:**

1. Klicken Sie auf **"Add record"**
2. Wählen Sie **CNAME**
3. Füllen Sie aus:
   - **Name:** `freeswitch`
   - **Target:** `YOUR_TUNNEL_ID.cfargotunnel.com` (ersetzen Sie YOUR_TUNNEL_ID!)
   - **Proxy status:** ✅ **Proxied** (orange Wolke)
4. Klicken Sie auf **Save**

**Wichtig:** Die orange Wolke muss aktiviert sein!

---

### Schritt 7: Tunnel starten

**7.1 Tunnel testen (manuell):**

```bash
cloudflared tunnel run aidevelo-freeswitch
```

**Erwartetes Ergebnis:**
```
2024-XX-XX INF Starting metrics server
2024-XX-XX INF +--------------------------------------------------------------------------------------------+
2024-XX-XX INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
2024-XX-XX INF |  https://freeswitch.aidevelo.ai
2024-XX-XX INF +--------------------------------------------------------------------------------------------+
```

**7.2 Tunnel als Service einrichten (für dauerhaften Betrieb):**

```bash
# Service installieren
cloudflared service install

# Service starten
systemctl start cloudflared

# Service aktivieren (startet automatisch beim Boot)
systemctl enable cloudflared

# Status prüfen
systemctl status cloudflared
```

**7.3 Logs prüfen:**

```bash
# Service Logs
journalctl -u cloudflared -f

# Oder direkt
cloudflared tunnel info aidevelo-freeswitch
```

---

### Schritt 8: Backend konfigurieren (Render)

**8.1 Render Dashboard öffnen:**

1. Gehen Sie zu: https://dashboard.render.com
2. Wählen Sie Ihren Service: `real-aidevelo-ai`
3. Klicken Sie auf **Environment** (links im Menü)

**8.2 Environment Variable hinzufügen:**

1. Klicken Sie auf **"Add Environment Variable"**
2. Füllen Sie aus:
   - **Key:** `FREESWITCH_WSS_URL`
   - **Value:** `wss://freeswitch.aidevelo.ai`
3. Klicken Sie auf **"Save Changes"**

**8.3 Render deployt automatisch neu** (1-2 Minuten)

---

### Schritt 9: Testen

**9.1 WebSocket-Verbindung testen:**

```bash
# Von Ihrem Computer
curl -v https://freeswitch.aidevelo.ai:7443
```

**9.2 Im Dashboard testen:**

1. Gehen Sie zu: https://aidevelo.ai/dashboard/test-call
2. Klicken Sie auf: **"Mit FreeSWITCH verbinden"**
3. Status sollte sein: **"Verbunden"** (grün) ✅

---

## ✅ Checkliste

- [ ] Docker auf VPS installiert
- [ ] FreeSWITCH läuft auf `localhost:7443`
- [ ] Cloudflared installiert
- [ ] Cloudflare Tunnel erstellt
- [ ] Tunnel konfiguriert (`~/.cloudflared/config.yml`)
- [ ] DNS CNAME in Cloudflare gesetzt
- [ ] Tunnel läuft (als Service)
- [ ] `FREESWITCH_WSS_URL` in Render gesetzt
- [ ] Render neu deployed
- [ ] Test Call funktioniert im Dashboard

---

## 🐛 Troubleshooting

### Problem: "Tunnel kann nicht verbinden"

**Lösung:**
```bash
# Prüfe ob FreeSWITCH läuft
docker ps | grep freeswitch

# Prüfe ob Port 7443 offen ist
netstat -tulpn | grep 7443

# Prüfe Tunnel Logs
journalctl -u cloudflared -n 50
```

### Problem: "DNS löst nicht auf"

**Lösung:**
1. Prüfe Cloudflare Dashboard → DNS
2. CNAME muss auf `TUNNEL_ID.cfargotunnel.com` zeigen
3. Proxy-Status muss aktiviert sein (orange Wolke)
4. Warte 1-2 Minuten für DNS-Propagierung

### Problem: "WebSocket-Verbindung schlägt fehl"

**Lösung:**
1. Prüfe ob Tunnel läuft: `systemctl status cloudflared`
2. Prüfe Tunnel Logs: `journalctl -u cloudflared -f`
3. Prüfe ob `FREESWITCH_WSS_URL` in Render gesetzt ist
4. Prüfe ob Render neu deployed wurde

### Problem: "FreeSWITCH startet nicht"

**Lösung:**
```bash
# Prüfe Docker Logs
docker logs aidevelo-freeswitch

# Prüfe ob Ports frei sind
netstat -tulpn | grep 7443

# Starte FreeSWITCH neu
docker compose restart freeswitch
```

---

## 📝 Wichtige Befehle

```bash
# Tunnel Status
cloudflared tunnel info aidevelo-freeswitch

# Tunnel Logs
journalctl -u cloudflared -f

# FreeSWITCH Status
docker exec aidevelo-freeswitch fs_cli -x "status"

# FreeSWITCH Logs
docker logs aidevelo-freeswitch -f

# Service neu starten
systemctl restart cloudflared
docker compose restart freeswitch
```

---

## 🎯 Zusammenfassung

**Nach dieser Anleitung haben Sie:**

1. ✅ FreeSWITCH läuft auf einem VPS
2. ✅ Cloudflare Tunnel verbindet VPS mit Internet
3. ✅ FreeSWITCH ist erreichbar unter `wss://freeswitch.aidevelo.ai`
4. ✅ Backend weiß, wo FreeSWITCH ist (`FREESWITCH_WSS_URL`)
5. ✅ Test Call funktioniert im Dashboard

**Ihre FreeSWITCH URL ist:**
```
wss://freeswitch.aidevelo.ai
```

**Diese URL müssen Sie in Render Environment Variables setzen!**

