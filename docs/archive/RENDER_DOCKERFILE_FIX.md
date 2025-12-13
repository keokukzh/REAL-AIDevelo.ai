# 🐳 Docker Build Fix für Render

## Problem:
Docker Build schlägt fehl weil:
- `COPY server/` nicht gefunden
- `COPY shared/` nicht gefunden
- `COPY server/.npmrc` nicht gefunden

## Lösung:

Das Dockerfile erwartet, dass der **Build-Kontext das Root-Verzeichnis** ist, nicht `server/`.

### Option 1: Render mit Root Directory (EMPFOHLEN)

**Render Settings:**
- **Root Directory:** `.` (Root, NICHT `server`)
- **Dockerfile Path:** `server/Dockerfile`
- **Build Command:** (leer lassen - Dockerfile macht alles)
- **Start Command:** `node dist/app.js`

### Option 2: Render ohne Docker (EINFACHER)

**Render Settings:**
- **Root Directory:** `server`
- **Environment:** `Node` (NICHT Docker)
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Environment Variables:**
```
DATABASE_URL=postgresql://postgres:jfH5dLfhBhdvQvIq@db.pdxdgfxhpyefqyouotat.supabase.co:5432/postgres
NODE_ENV=production
PORT=10000
```

## ✅ Empfehlung: Option 2 (Ohne Docker)

**Warum?**
- ✅ Einfacher Setup
- ✅ Schneller Build
- ✅ Weniger Fehlerquellen
- ✅ Funktioniert garantiert

**Schritte:**
1. Render → New Web Service
2. GitHub Repo verbinden
3. **Root Directory:** `server`
4. **Environment:** `Node`
5. **Build:** `npm install && npm run build`
6. **Start:** `npm start`
7. Environment Variables setzen
8. Deploy!

## 🎯 WICHTIG:

**Für Option 1 (Docker):**
- Build-Kontext MUSS Root sein
- Dockerfile Path: `server/Dockerfile`

**Für Option 2 (Node):**
- Root Directory: `server`
- Kein Dockerfile nötig
- Einfacher und schneller!

