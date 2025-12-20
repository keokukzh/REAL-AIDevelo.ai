# 🔧 PUBLIC_BASE_URL in FreeSWITCH setzen

## 📍 WO wird es gesetzt?

**Datei:** `docker-compose.yml` (Zeile 145-146)

**Aktuell:**
```yaml
environment:
  - PUBLIC_BASE_URL=${PUBLIC_BASE_URL:-https://real-aidevelo-ai.onrender.com}
```

Das bedeutet: Es verwendet die Umgebungsvariable `PUBLIC_BASE_URL` oder den Fallback-Wert.

---

## ✅ LÖSUNG: Auf dem Server

### Schritt 1: `.env` Datei erstellen/bearbeiten

**Auf dem Hetzner Server (SSH):**

```bash
cd ~/REAL-AIDevelo.ai

# Erstelle .env Datei (falls nicht vorhanden)
nano .env
```

**Inhalt der `.env` Datei:**
```bash
PUBLIC_BASE_URL=https://real-aidevelo-ai.onrender.com
```

**Speichern:** `Ctrl+O`, dann `Enter`, dann `Ctrl+X`

---

### Schritt 2: FreeSWITCH neu starten

```bash
# Container stoppen
docker stop aidevelo-freeswitch

# Container starten (docker-compose liest .env automatisch)
docker compose up -d freeswitch

# Oder direkt mit Umgebungsvariable:
PUBLIC_BASE_URL=https://real-aidevelo-ai.onrender.com docker compose up -d freeswitch
```

---

### Schritt 3: Prüfen ob es funktioniert

```bash
# Prüfe Umgebungsvariable im Container
docker exec aidevelo-freeswitch env | grep PUBLIC_BASE_URL

# Sollte zeigen:
# PUBLIC_BASE_URL=https://real-aidevelo-ai.onrender.com
```

---

## 🔄 Alternative: Direkt beim Container-Start

**Wenn docker-compose nicht verwendet wird:**

```bash
docker stop aidevelo-freeswitch
docker rm aidevelo-freeswitch

docker run -d \
  --name aidevelo-freeswitch \
  -e PUBLIC_BASE_URL=https://real-aidevelo-ai.onrender.com \
  -e BACKEND_URL=https://real-aidevelo-ai.onrender.com \
  -p 5060:5060/udp -p 5060:5060/tcp \
  -p 7443:7443/tcp \
  -v $(pwd)/infra/freeswitch/dialplan:/etc/freeswitch/dialplan/default \
  -v $(pwd)/infra/freeswitch/vars.xml:/etc/freeswitch/vars.xml \
  -v $(pwd)/infra/freeswitch/scripts:/usr/share/freeswitch/scripts \
  safarov/freeswitch:latest
```

---

## ✅ SCHNELL-LÖSUNG (Alles in einem):

**Auf dem Server ausführen:**

```bash
cd ~/REAL-AIDevelo.ai

# Setze PUBLIC_BASE_URL in .env
echo "PUBLIC_BASE_URL=https://real-aidevelo-ai.onrender.com" >> .env

# FreeSWITCH neu starten
docker compose down freeswitch
docker compose up -d freeswitch

# Prüfen
docker exec aidevelo-freeswitch env | grep PUBLIC_BASE_URL
```

---

## 📝 Zusammenfassung

**Datei:** `~/REAL-AIDevelo.ai/.env` auf dem Server
**Inhalt:** `PUBLIC_BASE_URL=https://real-aidevelo-ai.onrender.com`
**Dann:** `docker compose up -d freeswitch` ausführen

**FERTIG!** ✅

