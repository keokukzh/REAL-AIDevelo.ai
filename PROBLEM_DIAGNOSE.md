# 🔍 Problem-Diagnose

## ✅ Was funktioniert:

1. **DNS:** ✅ `freeswitch.aidevelo.ai` löst auf → Cloudflare IPs (172.67.177.71, 104.21.75.131)
2. **Cloudflare Tunnel:** ✅ Läuft als Service auf Hetzner Server
3. **Backend Config:** ✅ `FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai` in Render gesetzt
4. **FreeSWITCH lokal:** ✅ Läuft auf Ihrem Windows PC

## ❌ Das Problem:

**FreeSWITCH läuft nur LOKAL auf Ihrem Windows PC, nicht auf dem Hetzner Server!**

**Warum das ein Problem ist:**
- Browser verbindet sich mit `wss://freeswitch.aidevelo.ai`
- Cloudflare Tunnel leitet zu Hetzner Server weiter (91.99.202.18)
- Aber FreeSWITCH läuft nicht auf dem Server → Verbindung schlägt fehl!

---

## ✅ Lösung: FreeSWITCH auf Server starten

**Ich habe ein automatisches Script erstellt:** `setup_freeswitch_on_server.sh`

**Auf dem Hetzner Server ausführen:**

```bash
# SSH auf Server
ssh root@91.99.202.18

# Script herunterladen und ausführen
cd ~/REAL-AIDevelo.ai
chmod +x setup_freeswitch_on_server.sh
./setup_freeswitch_on_server.sh
```

**Das Script macht automatisch:**
- ✅ Prüft ob FreeSWITCH läuft
- ✅ Startet es falls nicht
- ✅ Prüft Port 7443
- ✅ Prüft Cloudflare Tunnel
- ✅ Zeigt vollständigen Status

---

## 🎯 Zusammenfassung

**Problem:** FreeSWITCH läuft nur lokal, nicht auf Server
**Lösung:** FreeSWITCH auf Hetzner Server starten
**Script:** `setup_freeswitch_on_server.sh` (automatisch)

**Nach dem Script:**
- Warten Sie 1-2 Minuten
- Testen Sie: https://aidevelo.ai/dashboard/test-call

