# ElevenLabs Agent ID Setup - Render Environment Variables

## Agent-ID
**Agent ID:** `agent_1601kcmqt4efe41bzwykaytm2yrj`

## Wo die Agent-ID gesetzt werden muss

### Option 1: Render Environment Variables (Empfohlen)

1. **Gehe zu Render Dashboard:**
   - Öffne https://dashboard.render.com
   - Wähle deinen Service "REAL-AIDevelo.ai" (oder wie dein Backend-Service heißt)

2. **Environment Tab öffnen:**
   - Klicke auf "Environment" im linken Menü
   - Oder gehe zu: Settings → Environment

3. **Environment Variable hinzufügen/aktualisieren:**
   - **Key:** `ELEVENLABS_AGENT_ID_DEFAULT`
   - **Value:** `agent_1601kcmqt4efe41bzwykaytm2yrj`
   - Klicke auf "Save Changes"

4. **Service neu starten:**
   - Nach dem Speichern wird der Service automatisch neu gestartet
   - Oder klicke manuell auf "Manual Deploy" → "Clear build cache & deploy"

### Option 2: In der Datenbank (Automatisch)

Die Agent-ID wird automatisch in der `agent_configs` Tabelle gesetzt, wenn:
- Eine neue Agent-Config erstellt wird
- Eine bestehende Config keine `eleven_agent_id` hat

**Manuell in Supabase setzen (falls nötig):**
```sql
UPDATE agent_configs 
SET eleven_agent_id = 'agent_1601kcmqt4efe41bzwykaytm2yrj'
WHERE eleven_agent_id IS NULL OR eleven_agent_id = '';
```

### Option 3: In den Einstellungen (Frontend)

1. Gehe zu https://aidevelo.ai/dashboard/settings
2. Scrolle zu "Agent-Konfiguration"
3. Füge die Agent-ID ein: `agent_1601kcmqt4efe41bzwykaytm2yrj`
4. Klicke auf "Speichern"

## Verifizierung

### 1. Prüfe Environment Variable in Render:
```bash
# In Render Dashboard → Environment
# Sollte zeigen:
ELEVENLABS_AGENT_ID_DEFAULT = agent_1601kcmqt4efe41bzwykaytm2yrj
```

### 2. Teste Agent-Verbindung:
```bash
# Dev-Endpunkt (nur in Development)
POST /api/dev/elevenlabs/test-connection
Body: {
  "agentId": "agent_1601kcmqt4efe41bzwykaytm2yrj"
}
```

### 3. Prüfe Backend-Logs:
Nach dem Neustart sollten die Logs zeigen:
```
[VoiceAgentRoutes] Agent verified in ElevenLabs: { agentId: 'agent_1601kcmqt4efe41bzwykaytm2yrj', agentName: '...' }
```

## Wichtige Hinweise

1. **Default-Wert im Code:**
   - Der Code verwendet jetzt `agent_1601kcmqt4efe41bzwykaytm2yrj` als Fallback
   - Wenn `ELEVENLABS_AGENT_ID_DEFAULT` in Render gesetzt ist, wird dieser verwendet
   - Wenn nicht gesetzt, wird der Fallback verwendet

2. **Priorität:**
   - Render Environment Variable (`ELEVENLABS_AGENT_ID_DEFAULT`) hat höchste Priorität
   - Datenbank (`agent_configs.eleven_agent_id`) hat zweite Priorität
   - Code-Fallback wird nur verwendet, wenn beide leer sind

3. **Nach dem Setzen:**
   - Service muss neu gestartet werden
   - Bestehende Agent-Configs werden automatisch aktualisiert (beim nächsten Zugriff)

## Troubleshooting

### Agent-ID wird nicht verwendet:
1. Prüfe Render Environment Variables
2. Prüfe Backend-Logs für Agent-Verifizierung
3. Prüfe Datenbank: `SELECT eleven_agent_id FROM agent_configs;`

### "Agent not found" Fehler:
1. Stelle sicher, dass die Agent-ID korrekt ist: `agent_1601kcmqt4efe41bzwykaytm2yrj`
2. Prüfe, ob die Agent-ID in deinem ElevenLabs Account existiert
3. Prüfe, ob die API-Key Zugriff auf diesen Agent hat

### Agent-ID in Einstellungen ändern:
- Gehe zu `/dashboard/settings`
- Aktualisiere die Agent-ID in "Agent-Konfiguration"
- Klicke auf "Speichern"
