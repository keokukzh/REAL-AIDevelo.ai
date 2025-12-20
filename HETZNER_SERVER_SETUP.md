# Hetzner Server Setup - Komplette Anleitung

## ✅ Aktueller Status

**SSH-Key:** ✅ Bereits in Hetzner eingefügt (sichtbar im Dashboard: "aidevelo-hetzner")

**Ihr SSH-Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIM2Yg04I+rD4qQ16FJkpkHxLTGskYjmklxDZiBuKjmzO aidevelo-hetzner
```

---

## 💾 Volumes - Brauchen Sie das?

### ❌ NEIN - Volumes sind NICHT nötig für FreeSWITCH!

**Warum:**
- FreeSWITCH benötigt nur ~500MB Speicher
- Ubuntu 24.04 System-Image hat bereits 20GB
- Das reicht völlig aus für FreeSWITCH + Docker

**Empfehlung:**
- **Klicken Sie auf "Abbrechen"** im Volume-Dialog
- **Überspringen Sie Volumes** (nicht auswählen)
- **Sparen Sie Geld:** 0,48€/Monat für 10GB ist unnötig

**Nur wenn Sie später mehr Speicher brauchen:**
- Können Sie jederzeit ein Volume hinzufügen
- Für jetzt: NICHT nötig!

---

## 🚀 Server-Erstellung abschließen

### Schritt 1: Volumes überspringen

1. **Klicken Sie auf "Abbrechen"** im Volume-Dialog
2. **Volumes NICHT auswählen** (Kreis leer lassen)
3. **Weiter zur nächsten Sektion**

### Schritt 2: Weitere Optionen (optional)

**Firewalls:** ❌ Nicht nötig (Cloudflare Tunnel schützt)
**Backups:** ❌ Nicht nötig (können Sie später aktivieren)
**Platzierungsgruppen:** ❌ Nicht nötig
**Labels:** ❌ Optional (für Organisation)

### Schritt 3: Server erstellen

1. **Prüfen Sie die Zusammenfassung rechts:**
   - ✅ CX 23 Typ (3,23€/Monat)
   - ✅ Nürnberg Standort
   - ✅ Ubuntu 24.04 Image
   - ✅ IPv4, IPv6 Networking
   - ✅ SSH-Key: "aidevelo-hetzner"

2. **Klicken Sie auf: "Kostenpflichtig erstellen"**

3. **Warten Sie 1-2 Minuten** bis Server erstellt ist

---

## 📋 Nach Server-Erstellung

### Schritt 1: Server-IP notieren

1. **Im Hetzner Dashboard:**
   - Gehen Sie zu "Server" (links im Menü)
   - Klicken Sie auf Ihren neuen Server
   - **Notieren Sie die IPv4-Adresse** (z.B. `123.45.67.89`)

### Schritt 2: SSH-Verbindung testen

**Von Ihrem Windows PC:**

```powershell
# Verbinden Sie sich mit dem Server
ssh root@IHR_SERVER_IP
```

**Erwartetes Ergebnis:**
- Sie werden ohne Passwort-Eingabe verbunden ✅
- Oder: "Are you sure you want to continue connecting (yes/no)?" → Tippen Sie `yes`

**Wenn es funktioniert:** Sie sehen `root@ubuntu-server:~#`

---

## 🔧 FreeSWITCH auf Server deployen

**Nach erfolgreicher SSH-Verbindung:**

### Schritt 1: Docker installieren

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

### Schritt 2: Projekt klonen

```bash
# Projekt klonen
git clone https://github.com/keokukzh/REAL-AIDevelo.ai.git
cd REAL-AIDevelo.ai
```

### Schritt 3: FreeSWITCH starten

```bash
# Nur FreeSWITCH starten
docker compose up -d freeswitch

# Prüfen ob es läuft
docker ps | grep freeswitch
docker logs aidevelo-freeswitch
```

### Schritt 4: FreeSWITCH testen

```bash
# Status prüfen
docker exec aidevelo-freeswitch fs_cli -x "status"

# Port prüfen
netstat -tulpn | grep 7443
```

**Erwartetes Ergebnis:** FreeSWITCH läuft auf `localhost:7443`

---

## 🌐 Cloudflare Tunnel einrichten

**Jetzt folgen Sie der Anleitung:** `CLOUDFLARE_TUNNEL_SETUP.md`

**Kurzfassung:**
1. Cloudflared installieren
2. Tunnel erstellen
3. DNS in Cloudflare konfigurieren
4. Tunnel starten
5. `FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai` in Render setzen

---

## ✅ Checkliste

- [x] SSH-Key in Hetzner eingefügt
- [ ] Server erstellt (ohne Volume)
- [ ] Server-IP notiert
- [ ] SSH-Verbindung getestet
- [ ] Docker installiert
- [ ] FreeSWITCH deployed
- [ ] Cloudflare Tunnel eingerichtet
- [ ] `FREESWITCH_WSS_URL` in Render gesetzt
- [ ] Test Call funktioniert

---

## 💰 Kosten-Übersicht

**Server (CX 23):** 3,23€/Monat
**IPv4:** 0,54€/Monat
**Volume:** 0€ (nicht nötig!)
**Gesamt:** ~3,77€/Monat

**Cloudflare Tunnel:** Kostenlos ✅

---

## 🆘 Troubleshooting

### Problem: "Permission denied (publickey)"

**Lösung:**
1. Prüfen Sie ob SSH-Key in Hetzner korrekt eingefügt wurde
2. Prüfen Sie ob Sie den richtigen Key verwenden:
   ```powershell
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
   ```
3. Stellen Sie sicher, dass der Key dem Server zugewiesen ist

### Problem: "Connection refused"

**Lösung:**
1. Warten Sie 1-2 Minuten nach Server-Erstellung
2. Prüfen Sie ob Server läuft (Hetzner Dashboard)
3. Prüfen Sie ob IPv4-Adresse korrekt ist

### Problem: "Volume-Dialog blockiert"

**Lösung:**
1. Klicken Sie auf "Abbrechen"
2. Volumes NICHT auswählen
3. Weiter mit Server-Erstellung

---

## 📝 Zusammenfassung

**Jetzt tun:**
1. ✅ SSH-Key ist bereits eingefügt
2. ❌ Volumes NICHT erstellen (Abbrechen klicken)
3. ✅ Server erstellen
4. ✅ Server-IP notieren
5. ✅ SSH-Verbindung testen
6. ✅ FreeSWITCH deployen
7. ✅ Cloudflare Tunnel einrichten

**Ihr SSH-Key ist bereits korrekt eingefügt!** 🎉

Sie müssen ihn NICHT nochmal setzen - er ist bereits im Dashboard sichtbar.

