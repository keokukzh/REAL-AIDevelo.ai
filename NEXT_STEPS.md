# 🚀 Nächste Schritte - Server ist bereit!

## ✅ Status

**Server erstellt:** ✅ `ubuntu-4gb-nbg1-1`
**IP-Adresse:** `91.99.202.18`
**Status:** Läuft (grüner Punkt)
**Standort:** Nürnberg

---

## 📋 Schritt 1: SSH-Verbindung testen

**Öffnen Sie PowerShell auf Ihrem Windows PC:**

```powershell
ssh root@91.99.202.18
```

**Erwartetes Ergebnis:**
- Sie werden ohne Passwort verbunden ✅
- Oder: "Are you sure you want to continue connecting (yes/no)?" → Tippen Sie `yes`
- Sie sehen: `root@ubuntu-4gb-nbg1-1:~#`

**Wenn es funktioniert:** Weiter zu Schritt 2!

**Wenn Fehler:** Prüfen Sie ob Server wirklich läuft (grüner Punkt im Dashboard)

---

## 📋 Schritt 2: Docker installieren

**Nach erfolgreicher SSH-Verbindung, führen Sie aus:**

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
apt-get update
apt-get install docker-compose-plugin -y

# Prüfen
docker --version
docker compose version
```

**Erwartetes Ergebnis:**
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

---

## 📋 Schritt 3: Projekt klonen

```bash
# Projekt klonen
git clone https://github.com/keokukzh/REAL-AIDevelo.ai.git
cd REAL-AIDevelo.ai
```

---

## 📋 Schritt 4: FreeSWITCH starten

```bash
# Nur FreeSWITCH starten
docker compose up -d freeswitch

# Warten Sie 30 Sekunden, dann prüfen:
docker ps | grep freeswitch
docker logs aidevelo-freeswitch --tail 20
```

**Erwartetes Ergebnis:**
- Container läuft
- Keine kritischen Fehler in Logs

---

## 📋 Schritt 5: FreeSWITCH testen

```bash
# Status prüfen
docker exec aidevelo-freeswitch fs_cli -x "status"

# Port prüfen
netstat -tulpn | grep 7443
```

**Erwartetes Ergebnis:**
- FreeSWITCH antwortet
- Port 7443 ist offen

---

## 📋 Schritt 6: Cloudflare Tunnel einrichten

**Jetzt folgen Sie der Anleitung:** `CLOUDFLARE_TUNNEL_SETUP.md`

**Kurzfassung:**
1. Cloudflared installieren
2. Tunnel erstellen
3. DNS in Cloudflare konfigurieren
4. Tunnel starten

**Detaillierte Anleitung:** Siehe `CLOUDFLARE_TUNNEL_SETUP.md` (Schritt 3-7)

---

## 📋 Schritt 7: Backend konfigurieren (Render)

**Nach Cloudflare Tunnel Setup:**

1. **Gehen Sie zu:** https://dashboard.render.com
2. **Wählen Sie:** `real-aidevelo-ai` Service
3. **Klicken Sie auf:** "Environment"
4. **Fügen Sie hinzu:**
   - **Key:** `FREESWITCH_WSS_URL`
   - **Value:** `wss://freeswitch.aidevelo.ai`
5. **Speichern** → Render deployt automatisch

---

## 📋 Schritt 8: Testen

1. **Warten Sie 1-2 Minuten** (Render deploy)
2. **Gehen Sie zu:** https://aidevelo.ai/dashboard/test-call
3. **Klicken Sie auf:** "Mit FreeSWITCH verbinden"
4. **Status sollte sein:** "Verbunden" (grün) ✅

---

## ✅ Checkliste

- [ ] SSH-Verbindung funktioniert
- [ ] Docker installiert
- [ ] Projekt geklont
- [ ] FreeSWITCH läuft
- [ ] Cloudflare Tunnel eingerichtet
- [ ] DNS konfiguriert
- [ ] `FREESWITCH_WSS_URL` in Render gesetzt
- [ ] Test Call funktioniert

---

## 🆘 Hilfe bei Problemen

### Problem: "Permission denied (publickey)"

**Lösung:**
```powershell
# Prüfen Sie ob SSH-Key korrekt ist
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

**Sollte sein:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIM2Yg04I+rD4qQ16FJkpkHxLTGskYjmklxDZiBuKjmzO aidevelo-hetzner
```

### Problem: "Connection refused"

**Lösung:**
- Warten Sie 1-2 Minuten (Server startet noch)
- Prüfen Sie im Hetzner Dashboard ob Server läuft

### Problem: "Docker installiert nicht"

**Lösung:**
```bash
# Als root ausführen
apt-get update
apt-get install -y curl
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

---

## 🎯 Zusammenfassung

**Ihre Server-Daten:**
- **IP:** `91.99.202.18`
- **Name:** `ubuntu-4gb-nbg1-1`
- **Status:** ✅ Läuft

**Nächster Schritt:**
```powershell
ssh root@91.99.202.18
```

**Dann:** Docker installieren → FreeSWITCH deployen → Cloudflare Tunnel

**Viel Erfolg!** 🚀

