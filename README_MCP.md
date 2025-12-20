# ElevenLabs MCP Integration - Quick Setup

## 🚀 Schnellstart

### 1. API Key setzen

```powershell
# Windows PowerShell
$env:ELEVENLABS_API_KEY="dein_api_key_hier"
```

### 2. MCP konfigurieren

```bash
npm run mcp:setup
```

### 3. Cursor neu starten

Nach dem Neustart ist die ElevenLabs MCP-Verbindung aktiv!

## ✅ Verifizierung

Frage Cursor AI: **"List my ElevenLabs agents"**

Wenn es funktioniert, siehst du deine Agents aufgelistet.

## 📁 Dateien

- **`.cursor/mcp.json`** - MCP-Konfiguration (wird automatisch erstellt, in .gitignore)
- **`.cursor/mcp.json.example`** - Beispiel-Konfiguration (committed)
- **`scripts/setup-mcp.js`** - Setup-Script
- **`docs/ELEVENLABS_MCP_SETUP.md`** - Detaillierte Dokumentation

## 🔧 Manuelle Konfiguration

Falls das automatische Setup nicht funktioniert, siehe [docs/ELEVENLABS_MCP_SETUP.md](docs/ELEVENLABS_MCP_SETUP.md)

## 📝 Verfügbare MCP-Funktionen

Mit der ElevenLabs MCP-Verbindung kannst du:

- ✅ Agents auflisten und verwalten
- ✅ Voice Generation testen
- ✅ Audio-Dateien verarbeiten
- ✅ Agent-Konfigurationen direkt anpassen

## ⚠️ Wichtig

- Die `.cursor/mcp.json` Datei enthält deinen API Key und ist in `.gitignore`
- Niemals API Keys committen!
- Verwende unterschiedliche Keys für Dev/Prod
