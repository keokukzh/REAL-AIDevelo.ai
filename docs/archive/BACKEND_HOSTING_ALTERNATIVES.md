# Backend Hosting Alternativen (KEIN Railway!)

## 🆓 Kostenlose Alternativen für Backend:

### 1. Render (EMPFOHLEN - Einfachste Migration)
- **Kostenlos:** 750 Stunden/Monat
- **Setup:** GitHub verbinden → Deploy
- **URL:** `https://your-app.onrender.com`
- **Datenbank:** Supabase (bereits konfiguriert ✅)

**Setup:**
1. Gehe zu https://render.com
2. "New Web Service"
3. GitHub Repo verbinden
4. Environment Variables setzen:
   - `DATABASE_URL` = Supabase Connection String
   - `NODE_ENV` = production
   - `PORT` = 10000 (Render Standard)
5. Deploy!

### 2. Fly.io (Schnell & Global)
- **Kostenlos:** 3 VMs, 3GB Storage
- **Setup:** `fly launch` → `fly deploy`
- **URL:** `https://your-app.fly.dev`

### 3. Cloudflare Workers (Serverless)
- **Kostenlos:** 100.000 Requests/Tag
- **Setup:** Wrangler CLI
- **URL:** `https://your-app.workers.dev`

### 4. Vercel (Für Node.js)
- **Kostenlos:** Unlimited Requests
- **Setup:** GitHub → Deploy
- **URL:** `https://your-app.vercel.app`

## 🔧 Frontend Konfiguration:

Das Frontend verwendet jetzt:
- **Production:** `window.location.origin + '/api'` (gleiche Domain)
- **Development:** `http://localhost:5000/api`

**Oder setze Environment Variable in Cloudflare Pages:**
- `VITE_API_URL` = Deine Backend URL

## ✅ Empfehlung: Render

**Warum Render?**
- ✅ Einfachste Migration von Railway
- ✅ Automatisches Deploy bei Git Push
- ✅ Kostenlos für kleine Projekte
- ✅ Supabase funktioniert perfekt

## 🚀 Nächste Schritte:

1. Wähle einen Hosting-Service (Render empfohlen)
2. Deploy Backend dort
3. Setze `DATABASE_URL` = Supabase Connection String
4. Update Frontend `VITE_API_URL` (optional)
5. Fertig!

**KEIN Railway mehr nötig!**

