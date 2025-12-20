# 🚀 FreeSWITCH Quick Start - Einfache Anleitung

## ❓ Was ist die FreeSWITCH URL?

**Die FreeSWITCH URL ist die Adresse, wo Ihr FreeSWITCH-Server läuft.**

Aktuell haben Sie **KEINE** FreeSWITCH URL, weil FreeSWITCH noch nicht deployed ist.

---

## 🎯 Was Sie jetzt tun müssen (3 Schritte)

### Schritt 1: FreeSWITCH deployen

Sie haben **2 Optionen**:

#### Option A: Lokal testen (Schnellste Lösung - 5 Minuten)

```bash
# 1. Terminal öffnen im Projekt-Ordner
cd C:\Users\Aidevelo\Desktop\REAL-AIDevelo.ai

# 2. FreeSWITCH starten
docker-compose up -d freeswitch

# 3. Prüfen ob es läuft
docker logs aidevelo-freeswitch
```

**Wenn es läuft, ist Ihre FreeSWITCH URL:**
```
wss://localhost:7443
```

**ABER:** Diese URL funktioniert nur lokal auf Ihrem Computer, nicht in Production!

---

#### Option B: Production deployen (Für echte Nutzer)

**Sie müssen FreeSWITCH auf einem Server deployen.**

**Empfohlene Lösung: Cloudflare Tunnel (Einfachste Methode)**

1. **VPS mieten** (z.B. Hetzner Cloud, DigitalOcean, Contabo)
   - Mindestens 2GB RAM
   - Ubuntu 22.04
   - Kosten: ~5€/Monat

2. **Auf dem VPS FreeSWITCH installieren:**

```bash
# SSH auf Server
ssh root@IHR_SERVER_IP

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Projekt klonen
git clone https://github.com/keokukzh/REAL-AIDevelo.ai.git
cd REAL-AIDevelo.ai

# Nur FreeSWITCH starten
docker-compose up -d freeswitch
```

3. **Cloudflare Tunnel einrichten:**

```bash
# Cloudflare Tunnel installieren
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Tunnel erstellen
cloudflared tunnel login
cloudflared tunnel create aidevelo-freeswitch
```

4. **Tunnel konfigurieren:**

Erstelle Datei: `~/.cloudflared/config.yml`

```yaml
tunnel: IHR_TUNNEL_ID
credentials-file: /root/.cloudflared/IHR_TUNNEL_ID.json

ingress:
  - hostname: freeswitch.aidevelo.ai
    service: tcp://localhost:7443
  - service: http_status:404
```

5. **Tunnel starten:**

```bash
cloudflared tunnel run aidevelo-freeswitch
```

6. **DNS in Cloudflare konfigurieren:**
   - Gehe zu Cloudflare Dashboard
   - DNS → Neue CNAME-Regel
   - Name: `freeswitch`
   - Ziel: `IHR_TUNNEL_ID.cfargotunnel.com`
   - Proxy: ✅ (orange Wolke)

**Dann ist Ihre FreeSWITCH URL:**
```
wss://freeswitch.aidevelo.ai
```

---

### Schritt 2: URL in Render Environment Variables setzen

1. **Gehe zu Render Dashboard:** https://dashboard.render.com
2. **Wähle Ihren Service:** `real-aidevelo-ai` (oder wie Ihr Backend heißt)
3. **Klicke auf "Environment"** (links im Menü)
4. **Klicke auf "Add Environment Variable"**
5. **Füge hinzu:**
   - **Key:** `FREESWITCH_WSS_URL`
   - **Value:** 
     - Für lokal: `wss://localhost:7443` (funktioniert nur lokal!)
     - Für Production: `wss://freeswitch.aidevelo.ai` (nach Schritt 1 Option B)
6. **Klicke auf "Save Changes"**
7. **Render deployt automatisch neu** (kann 1-2 Minuten dauern)

---

### Schritt 3: Testen

1. **Warte bis Render neu deployed ist** (siehe "Events" Tab)
2. **Gehe zu:** https://aidevelo.ai/dashboard/test-call
3. **Klicke auf:** "Mit FreeSWITCH verbinden"
4. **Status sollte sein:** "Verbunden" (grün) ✅

---

## 🔍 Aktuelle Situation prüfen

**Prüfen Sie, ob FreeSWITCH bereits läuft:**

```bash
# Lokal prüfen
docker ps | grep freeswitch

# Wenn nichts läuft, sehen Sie keine Ausgabe
```

**Prüfen Sie, ob eine URL in Render gesetzt ist:**

1. Gehe zu Render Dashboard
2. Environment Variables anschauen
3. Suche nach `FREESWITCH_WSS_URL`

**Wenn NICHT gesetzt:**
- Sie müssen zuerst FreeSWITCH deployen (Schritt 1)
- Dann die URL setzen (Schritt 2)

---

## ⚠️ Wichtige Hinweise

1. **Lokale URL (`wss://localhost:7443`) funktioniert NUR auf Ihrem Computer**
   - Nicht für Production nutzbar
   - Nur für lokale Tests

2. **Production URL braucht einen öffentlichen Server**
   - FreeSWITCH muss auf einem Server laufen
   - Der Server muss von außen erreichbar sein
   - SSL-Zertifikat wird benötigt (Cloudflare Tunnel macht das automatisch)

3. **Ohne FreeSWITCH URL funktioniert der Test Call nicht**
   - Der Browser kann sich nicht verbinden
   - Status bleibt "Nicht verbunden"

---

## 🆘 Hilfe bei Problemen

### Problem: "Ich verstehe nicht, was ich tun soll"

**Einfachste Lösung für sofortige Tests:**

1. Öffnen Sie ein Terminal
2. Führen Sie aus: `docker-compose up -d freeswitch`
3. Warten Sie 30 Sekunden
4. Gehen Sie zu: http://localhost:4000/dashboard/test-call
5. Klicken Sie auf "Mit FreeSWITCH verbinden"

**Wenn das funktioniert:** FreeSWITCH läuft lokal ✅

**Für Production:** Sie müssen FreeSWITCH auf einem Server deployen (siehe Schritt 1 Option B)

---

### Problem: "Ich habe keinen VPS"

**Optionen:**

1. **Hetzner Cloud** (empfohlen, günstig): https://www.hetzner.com/cloud
   - CX11 (2GB RAM): ~4€/Monat
   - Ubuntu 22.04 auswählen

2. **DigitalOcean**: https://www.digitalocean.com
   - Basic Droplet: ~6€/Monat

3. **Contabo**: https://www.contabo.com
   - VPS S: ~5€/Monat

4. **Railway** (einfacher, aber teurer): https://railway.app
   - Kann FreeSWITCH direkt deployen
   - Aber: Benutzerdefinierte Ports sind schwierig

---

### Problem: "Render zeigt immer noch 'Nicht verbunden'"

**Prüfen Sie:**

1. **Ist FreeSWITCH deployed?**
   ```bash
   # Auf dem Server
   docker ps | grep freeswitch
   ```

2. **Ist die URL in Render gesetzt?**
   - Render Dashboard → Environment → `FREESWITCH_WSS_URL` vorhanden?

3. **Ist Render neu deployed?**
   - Render Dashboard → Events → Neuester Deploy erfolgreich?

4. **Testen Sie die URL direkt:**
   ```bash
   # Von Ihrem Computer
   curl -v wss://freeswitch.aidevelo.ai:7443
   # Oder mit Browser: https://freeswitch.aidevelo.ai:7443
   ```

---

## 📝 Zusammenfassung

**Was Sie jetzt tun müssen:**

1. ✅ **FreeSWITCH deployen** (lokal ODER auf Server)
2. ✅ **URL in Render setzen** (`FREESWITCH_WSS_URL`)
3. ✅ **Testen** im Dashboard

**Ihre FreeSWITCH URL ist:**
- Lokal: `wss://localhost:7443`
- Production: `wss://freeswitch.aidevelo.ai` (nach Deployment)

**Diese URL müssen Sie in Render Environment Variables setzen!**

---

## 🎯 Nächster Schritt

**Fangen Sie mit Option A an (lokale Tests):**

```bash
docker-compose up -d freeswitch
```

**Dann testen Sie:** http://localhost:4000/dashboard/test-call

**Wenn das funktioniert, deployen Sie für Production (Option B).**

