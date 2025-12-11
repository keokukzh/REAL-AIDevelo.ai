# 🚀 SOFORT Backend auf Render deployen (5 Minuten!)

## Schritt 1: Render Account erstellen
1. Gehe zu https://render.com
2. Sign up mit GitHub (kostenlos)

## Schritt 2: Backend deployen
1. Klicke "New" → "Web Service"
2. Verbinde GitHub Repo: `REAL-AIDevelo.ai`
3. **Settings:**
   - **Name:** `aidevelo-api`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

## Schritt 3: Environment Variables setzen
Klicke "Environment" und füge hinzu:
```
DATABASE_URL=postgresql://postgres:jfH5dLfhBhdvQvIq@db.pdxdgfxhpyefqyouotat.supabase.co:5432/postgres
NODE_ENV=production
PORT=10000
ELEVENLABS_API_KEY=dein_key_hier
```

## Schritt 4: Deploy!
1. Klicke "Create Web Service"
2. Warte 2-3 Minuten
3. Backend URL wird generiert: `https://aidevelo-api.onrender.com`

## Schritt 5: Frontend aktualisieren
1. Cloudflare Pages Dashboard öffnen
2. Settings → Environment Variables
3. Setze: `VITE_API_URL` = `https://aidevelo-api.onrender.com/api`
4. Redeploy Frontend

## ✅ FERTIG!
Nach 5 Minuten läuft alles online!

