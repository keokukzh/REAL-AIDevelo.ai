# Agent Test Guide - Vollständige Anleitung

## Übersicht

Der Agent Test ermöglicht es, den Voice Agent zu testen, genau wie ein echter Kundenanruf. Es gibt zwei Modi:
- **Voice-Modus**: Echter Voice-Call über WebRTC mit FreeSWITCH
- **Chat-Modus**: Text-Input mit Voice-Antwort (Agent antwortet immer per Voice)

## Voraussetzungen

### 1. FreeSWITCH auf Hetzner Server
- FreeSWITCH Container muss laufen
- Port 7443 muss offen sein
- Cloudflare Tunnel muss aktiv sein
- DNS: `freeswitch.aidevelo.ai` muss auf Tunnel zeigen

**Status prüfen:**
```bash
ssh root@91.99.202.18
./scripts/check_freeswitch_status.sh
```

**Falls nicht läuft:**
```bash
./scripts/start_freeswitch.sh
```

### 2. Render Environment Variable
- `FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai` (OHNE Port!)

### 3. Agent Konfiguration
- Agent Config muss existieren
- Location ID muss vorhanden sein
- Optional: Calendar verbunden für Tool-Tests

## Test-URL

**Production:** https://aidevelo.ai/dashboard/test-call
**Test-Konto:** keokukmusic@gmail.com / Kukukeku992

## Voice-Modus Test

### Schritt 1: Verbindung herstellen
1. Gehe zu `/dashboard/test-call`
2. Wähle "Voice" Modus (Standard)
3. Klicke "Mit FreeSWITCH verbinden"
4. Status sollte "Verbunden" (grün) werden

**Erwartetes Ergebnis:**
- ✅ Verbindungsstatus: "Verbunden"
- ✅ Keine Fehlermeldungen

**Falls Fehler:**
- Prüfe FreeSWITCH Status auf Hetzner Server
- Prüfe Browser Console für Details
- Prüfe `FREESWITCH_WSS_URL` in Render

### Schritt 2: Call starten
1. Klicke "Test Call starten"
2. Erlaube Mikrofon-Zugriff (Browser-Prompt)
3. Call Status sollte sein: "connecting" → "ringing" → "active"

**Erwartetes Ergebnis:**
- ✅ Call Status: "Aktiv"
- ✅ Call-Dauer wird angezeigt
- ✅ Mikrofon funktioniert

### Schritt 3: Mit Agent sprechen
1. Spreche eine Frage (z.B. "Hallo, wann habt ihr geöffnet?")
2. Warte auf Agent-Antwort
3. Transcript zeigt User + Agent Nachrichten

**Erwartetes Ergebnis:**
- ✅ Agent antwortet per Voice
- ✅ Transcript wird aktualisiert
- ✅ Agent versteht Anliegen

### Schritt 4: Call beenden
1. Klicke "Call beenden"
2. Call Status: "Beendet"
3. Transcript bleibt sichtbar

## Chat-Modus Test

### Schritt 1: Chat-Modus aktivieren
1. Gehe zu `/dashboard/test-call`
2. Klicke "Chat" Button (Toggle)
3. Chat-Input Feld erscheint

**Erwartetes Ergebnis:**
- ✅ Chat-Modus ist aktiv
- ✅ Text-Input Feld ist verfügbar
- ✅ "Senden" Button ist verfügbar

### Schritt 2: Nachricht senden
1. Tippe eine Nachricht (z.B. "Ich möchte einen Termin am 15.01.2025 um 14:00")
2. Klicke "Senden" oder drücke Enter
3. Nachricht erscheint im Transcript

**Erwartetes Ergebnis:**
- ✅ Nachricht wird gesendet
- ✅ Loading State während Verarbeitung
- ✅ Agent antwortet mit Text + Audio

### Schritt 3: Audio-Antwort
1. Agent-Antwort erscheint im Transcript
2. Audio wird automatisch abgespielt
3. Tool Calls werden angezeigt (falls vorhanden)

**Erwartetes Ergebnis:**
- ✅ Agent antwortet per Voice (Audio wird abgespielt)
- ✅ Text-Antwort ist sichtbar
- ✅ Tool Calls werden angezeigt (z.B. "📅 Termin erstellt")

## Agent Tools Test

### Kalender-Tool Test

**Test-Szenario 1: Termin erstellen**
```
User: "Ich möchte einen Termin am 15.01.2025 um 14:00"
```

**Erwartetes Ergebnis:**
- ✅ Agent versteht Termin-Anfrage
- ✅ Agent führt `calendar.create_appointment` Tool aus
- ✅ Tool Call wird im Transcript angezeigt: "📅 Termin erstellt: 15.01.2025 14:00 - Termin"
- ✅ Termin wird im Google Calendar erstellt (falls verbunden)
- ✅ Agent bestätigt Termin-Erstellung

**Test-Szenario 2: Verfügbarkeit prüfen**
```
User: "Ist am 20.01.2025 um 10:00 noch etwas frei?"
```

**Erwartetes Ergebnis:**
- ✅ Agent prüft Kalender
- ✅ Agent führt `calendar.check_availability` Tool aus
- ✅ Agent gibt Verfügbarkeit zurück
- ✅ Tool Call wird angezeigt

**Test-Szenario 3: Komplexe Anfrage**
```
User: "Ich brauche einen Termin nächste Woche, am besten Vormittag"
```

**Erwartetes Ergebnis:**
- ✅ Agent versteht komplexe Anfrage
- ✅ Agent schlägt verfügbare Slots vor
- ✅ Agent fragt nach Bestätigung

### Voraussetzungen für Kalender-Tests
- Calendar muss verbunden sein (Google OAuth)
- Token muss in DB gespeichert sein
- Calendar Service muss funktionieren

## RAG Knowledge Base Test

**Test-Szenario:**
```
User: "Was sind eure Öffnungszeiten?"
```

**Erwartetes Ergebnis:**
- ✅ Agent nutzt Knowledge Base (falls Dokumente hochgeladen)
- ✅ Relevante Dokumente werden abgerufen
- ✅ Context wird in Antworten verwendet
- ✅ Agent antwortet mit korrekten Öffnungszeiten

**Voraussetzungen:**
- Knowledge Base Dokumente müssen hochgeladen sein
- RAG muss aktiviert sein
- Qdrant muss erreichbar sein

## Fehlerbehandlung Test

### Test 1: FreeSWITCH nicht erreichbar
**Szenario:** FreeSWITCH Container läuft nicht

**Erwartetes Ergebnis:**
- ✅ Klare Fehlermeldung: "FreeSWITCH server is not reachable"
- ✅ Hinweis: "Please ensure FreeSWITCH is running"
- ✅ Keine Crash, App bleibt funktionsfähig

### Test 2: Mikrofon nicht verfügbar
**Szenario:** Mikrofon-Zugriff verweigert

**Erwartetes Ergebnis:**
- ✅ User-freundliche Meldung: "Mikrofon-Berechtigung verweigert"
- ✅ Hinweis: "Bitte erlauben Sie den Zugriff auf Ihr Mikrofon"
- ✅ Keine Crash

### Test 3: Agent Config fehlt
**Szenario:** Keine Agent Config vorhanden

**Erwartetes Ergebnis:**
- ✅ Hinweis: "Agent-Konfiguration wird geladen..."
- ✅ Oder: "Bitte konfigurieren Sie zuerst einen Agent"

### Test 4: Calendar nicht verbunden
**Szenario:** Termin-Anfrage aber Calendar nicht verbunden

**Erwartetes Ergebnis:**
- ✅ Agent erklärt: "Kalender ist nicht verbunden"
- ✅ Hinweis: "Bitte verbinden Sie zuerst einen Kalender"
- ✅ Keine Crash

## Troubleshooting

### Problem: Verbindung zu FreeSWITCH schlägt fehl
**Lösung:**
1. Prüfe FreeSWITCH Status: `./scripts/check_freeswitch_status.sh`
2. Prüfe Cloudflare Tunnel: `systemctl status cloudflared`
3. Prüfe DNS: `nslookup freeswitch.aidevelo.ai`
4. Prüfe `FREESWITCH_WSS_URL` in Render

### Problem: Call startet nicht
**Lösung:**
1. Prüfe Browser Console für Fehler
2. Prüfe Mikrofon-Berechtigung
3. Prüfe FreeSWITCH Logs: `docker logs aidevelo-freeswitch --tail 50`

### Problem: Agent antwortet nicht
**Lösung:**
1. Prüfe Backend Logs (Render)
2. Prüfe ASR Service (OpenAI Realtime API)
3. Prüfe LLM Service (OpenAI API)
4. Prüfe TTS Service (ElevenLabs)

### Problem: Tool Calls funktionieren nicht
**Lösung:**
1. Prüfe Calendar Verbindung
2. Prüfe Calendar Token in DB
3. Prüfe Calendar Service Logs
4. Prüfe Tool Registry

### Problem: Audio wird nicht abgespielt
**Lösung:**
1. Prüfe Browser Audio-Einstellungen
2. Prüfe Audio-URL (sollte erreichbar sein)
3. Prüfe TTS Service
4. Prüfe Browser Console für Audio-Fehler

## Erfolgskriterien

### Must-Have:
- ✅ Voice-Modus funktioniert wie echter Kundenanruf
- ✅ Chat-Modus funktioniert (Text-Input → Voice-Antwort)
- ✅ Agent antwortet immer per Voice (korrekt wie eingerichtet)
- ✅ Agent versteht Kunden-Anliegen korrekt
- ✅ Agent führt Tools aus (Kalender-Einträge etc.)
- ✅ FreeSWITCH läuft auf Hetzner Server
- ✅ Transcript wird korrekt angezeigt
- ✅ Tool Calls werden angezeigt

### Nice-to-Have:
- ⚠️ RAG Knowledge Base Integration
- ⚠️ Erweiterte Tool Calls (SMS, Email, etc.)
- ⚠️ Call Recording
- ⚠️ Analytics Integration

## Nächste Schritte nach Tests

1. **Bei Problemen:** Fehler dokumentieren und beheben
2. **Bei Erfolg:** Production Deployment vorbereiten
3. **Monitoring:** Error Logging aktivieren
4. **Performance:** Response Times optimieren

