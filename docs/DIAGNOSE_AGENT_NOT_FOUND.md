# Diagnose: "Agent not found" Fehler beheben

## Problem
Der Fehler "Agent not found: The AI agent you are trying to reach does not exist" tritt auf, wenn:
1. Die Agent ID nicht in ElevenLabs existiert
2. Die API Key keinen Zugriff auf den Agent hat
3. Die Agent ID falsch konfiguriert ist

## Lösungsschritte

### Schritt 1: Verfügbare Agents auflisten

**In Development:**
```bash
curl http://localhost:5000/api/dev/elevenlabs/list-agents
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "agent_id": "agent_abc123",
        "name": "My Agent",
        "language": "de"
      }
    ],
    "currentConfig": {
      "databaseAgentId": "agent_1601kcmqt4efe41bzwykaytm2yrj",
      "defaultAgentId": "agent_1601kcmqt4efe41bzwykaytm2yrj",
      "locationId": "..."
    },
    "recommendations": {
      "useAgentId": "agent_1601kcmqt4efe41bzwykaytm2yrj",
      "agentExists": false
    }
  }
}
```

**Wenn `agentExists: false`:**
- Die Agent ID existiert nicht in ElevenLabs
- Du musst eine existierende Agent ID verwenden oder einen neuen Agent erstellen

### Schritt 2: Agent ID in ElevenLabs prüfen

1. **Gehe zu ElevenLabs Dashboard:**
   - https://elevenlabs.io/app/agents
   - Melde dich mit deinem Account an

2. **Prüfe verfügbare Agents:**
   - Sieh dir die Liste der Agents an
   - Kopiere die `agent_id` eines existierenden Agents

3. **Oder erstelle einen neuen Agent:**
   - Klicke auf "Create Agent"
   - Konfiguriere den Agent
   - Kopiere die neue `agent_id`

### Schritt 3: Agent ID aktualisieren

**Option A: In Render Environment Variables (Empfohlen)**
1. Gehe zu https://dashboard.render.com
2. Wähle deinen Backend Service
3. Gehe zu "Environment"
4. Setze `ELEVENLABS_AGENT_ID_DEFAULT` = deine echte Agent ID
5. Service neu starten

**Option B: In der Datenbank**
```sql
UPDATE agent_configs 
SET eleven_agent_id = 'deine_echte_agent_id'
WHERE eleven_agent_id = 'agent_1601kcmqt4efe41bzwykaytm2yrj';
```

**Option C: In den Einstellungen (Frontend)**
1. Gehe zu https://aidevelo.ai/dashboard/settings
2. Scrolle zu "Agent-Konfiguration"
3. Füge die echte Agent ID ein
4. Klicke auf "Speichern"

### Schritt 4: Agent-Verbindung testen

**In Development:**
```bash
curl -X POST http://localhost:5000/api/dev/elevenlabs/test-connection \
  -H "Content-Type: application/json" \
  -d '{"agentId": "deine_echte_agent_id"}'
```

**Erfolgreiche Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "deine_echte_agent_id",
    "agentExists": true,
    "agentName": "My Agent",
    "agentLanguage": "de"
  }
}
```

### Schritt 5: API Key Berechtigungen prüfen

Wenn der Agent existiert, aber trotzdem nicht gefunden wird:

1. **Prüfe API Key:**
   - Stelle sicher, dass `ELEVENLABS_API_KEY` in Render gesetzt ist
   - Der API Key muss Zugriff auf den Agent haben

2. **Prüfe Agent-Berechtigungen:**
   - In ElevenLabs Dashboard → Agents
   - Stelle sicher, dass der Agent mit deinem API Key verknüpft ist

## Häufige Fehler

### "Agent not found" obwohl Agent existiert
- **Ursache:** API Key hat keinen Zugriff auf den Agent
- **Lösung:** Prüfe API Key Berechtigungen in ElevenLabs

### Agent ID wird nicht verwendet
- **Ursache:** Agent ID nicht korrekt in Render/Datenbank gesetzt
- **Lösung:** Prüfe `ELEVENLABS_AGENT_ID_DEFAULT` in Render und `agent_configs.eleven_agent_id` in Supabase

### Default Agent ID funktioniert nicht
- **Ursache:** `agent_1601kcmqt4efe41bzwykaytm2yrj` existiert nicht in deinem ElevenLabs Account
- **Lösung:** Verwende eine Agent ID aus deinem eigenen ElevenLabs Account

## Debugging

### Backend Logs prüfen
Nach dem Neustart sollten die Logs zeigen:
```
[VoiceAgentRoutes] Agent verified in ElevenLabs: { agentId: '...', agentName: '...' }
```

### Frontend Console prüfen
Die Fehlermeldung zeigt jetzt die verwendete Agent ID:
```
Agent not found: The AI agent you are trying to reach does not exist. Agent ID: agent_1601kcmqt4efe41bzwykaytm2yrj
```

## Zusammenfassung

1. ✅ Liste verfügbare Agents: `GET /api/dev/elevenlabs/list-agents`
2. ✅ Prüfe ElevenLabs Dashboard für existierende Agents
3. ✅ Setze korrekte Agent ID in Render/Datenbank/Einstellungen
4. ✅ Teste Verbindung: `POST /api/dev/elevenlabs/test-connection`
5. ✅ Prüfe API Key Berechtigungen

Nach diesen Schritten sollte der "Agent not found" Fehler behoben sein.
