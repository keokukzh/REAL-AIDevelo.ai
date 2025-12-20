# 🔧 FreeSWITCH Problem - Diagnose & Fix

## 🔍 Problem-Analyse

**Was ich sehe:**
- ✅ FreeSWITCH läuft **lokal** auf Ihrem Windows PC
- ✅ DNS löst auf: `freeswitch.aidevelo.ai` → Cloudflare IPs
- ❌ **FreeSWITCH läuft NICHT auf dem Hetzner Server!**

**Das Problem:**
- Der Browser versucht sich mit `wss://freeswitch.aidevelo.ai` zu verbinden
- Cloudflare Tunnel leitet zu Ihrem Hetzner Server weiter
- Aber FreeSWITCH läuft nicht auf dem Server, sondern nur lokal auf Ihrem PC!

---

## ✅ Lösung: FreeSWITCH auf Hetzner Server starten

**Sie müssen FreeSWITCH auf dem Hetzner Server starten, nicht lokal!**

### Schritt 1: SSH auf Server verbinden

```powershell
ssh root@91.99.202.18
```

### Schritt 2: FreeSWITCH prüfen und starten

**Auf dem Server (nach SSH-Verbindung):**

```bash
# Prüfe ob FreeSWITCH läuft
docker ps | grep freeswitch

# Wenn NICHT läuft:
cd ~/REAL-AIDevelo.ai
docker compose up -d freeswitch

# Warte 30 Sekunden
sleep 30

# Prüfe Status
docker ps | grep freeswitch
docker logs aidevelo-freeswitch --tail 20

# Prüfe Port 7443
netstat -tulpn | grep 7443

# Prüfe FreeSWITCH Status
docker exec aidevelo-freeswitch fs_cli -x "status"
```

**Erwartetes Ergebnis:**
- Container läuft (Status: Up)
- Port 7443 ist offen (LISTEN)
- FreeSWITCH antwortet

---

## 🚀 Automatisches Check-Script

**Ich habe ein Script erstellt:** `check_freeswitch_server.sh`

**Auf dem Server ausführen:**

```bash
# Script ausführbar machen
chmod +x check_freeswitch_server.sh

# Script ausführen
./check_freeswitch_server.sh
```

**Das Script:**
- Prüft ob FreeSWITCH läuft
- Startet es falls nicht
- Prüft Port 7443
- Prüft Cloudflare Tunnel
- Zeigt alle Status-Informationen

---

## 📋 Zusammenfassung

**Das Problem:**
- FreeSWITCH läuft nur lokal, nicht auf dem Server

**Die Lösung:**
- FreeSWITCH auf Hetzner Server starten (SSH → `docker compose up -d freeswitch`)

**Nach dem Start:**
- Warten Sie 30 Sekunden
- Testen Sie im Dashboard: https://aidevelo.ai/dashboard/test-call

---

## ✅ Checkliste

- [ ] SSH auf Hetzner Server verbunden
- [ ] FreeSWITCH auf Server gestartet (`docker compose up -d freeswitch`)
- [ ] FreeSWITCH läuft (Container Status: Up)
- [ ] Port 7443 ist offen (netstat zeigt LISTEN)
- [ ] Cloudflare Tunnel läuft (systemctl status cloudflared)
- [ ] Test im Dashboard funktioniert

**Das ist das Problem!** FreeSWITCH muss auf dem Server laufen, nicht lokal! 🎯

