# Lokale Entwicklung mit Supabase - Setup

## ✅ Supabase Verbindung - FERTIG KONFIGURIERT!

**Connection String:**
```
postgresql://postgres:jfH5dLfhBhdvQvIq@db.pdxdgfxhpyefqyouotat.supabase.co:5432/postgres
```

## 🚀 Server lokal starten

### 1. Environment Variables setzen

Erstelle/Update `server/.env`:
```env
DATABASE_URL=postgresql://postgres:jfH5dLfhBhdvQvIq@db.pdxdgfxhpyefqyouotat.supabase.co:5432/postgres
NODE_ENV=development
PORT=5000
ELEVENLABS_API_KEY=dein_api_key_hier
```

### 2. Server starten

```bash
cd server
npm run dev
```

Der Server läuft auf: **http://localhost:5000**

## ✅ Was funktioniert:

- ✅ Supabase Verbindung getestet
- ✅ Alle 10 Datenbank-Migrations ausgeführt
- ✅ Alle Tabellen erstellt:
  - users
  - agents
  - purchases
  - rag_documents
  - call_history
  - phone_numbers
  - audit_logs
  - call_logs
  - agent_call_metrics
  - schema_migrations

## 🧪 Testen

### Connection Test:
```bash
cd server
node test-supabase-connection.js
```

### Server Health Check:
```bash
curl http://localhost:5000/health
```

### API Endpoints:
- Health: `http://localhost:5000/health`
- API Docs: `http://localhost:5000/api-docs`
- Agents: `http://localhost:5000/api/v1/agents`

## 📝 Nächste Schritte

1. ✅ Server läuft lokal
2. ✅ Frontend verbinden (Port 5173)
3. ✅ Agent Creation testen
4. ✅ Alles funktioniert!

## 🔧 Troubleshooting

**Connection Error?**
- Prüfe ob `.env` Datei existiert
- Prüfe Connection String (keine Leerzeichen)
- Teste mit: `node test-supabase-connection.js`

**Port bereits belegt?**
- Ändere PORT in `.env`
- Oder beende anderen Prozess auf Port 5000

**Migrations Error?**
- Migrations wurden bereits ausgeführt ✅
- Falls nötig: `npm run migrate`

