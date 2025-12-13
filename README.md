# AIDevelo.ai - Swiss AI Voice Agent Platform

Real-AIDevelo.ai is a high-end platform for Swiss SMEs to deploy autonomous AI Voice Agents.
The system provides 24/7 call handling, lead qualification, and appointment booking with a focus on Swiss High German / Dialect support and data privacy (nDSG).

## 🚀 Key Features

- **AI Voice Agent**: Natural-sounding, conversational AI with RAG (Retrieval-Augmented Generation) knowledge per customer
- **Real-time Voice Pipeline**: ASR → LLM → TTS with OpenAI Realtime API and ElevenLabs
- **Voice Cloning**: Clone your own voice for a digital twin experience
- **Onboarding Wizard**: Step-by-step setup for companies (Hours, Objectives, Calendar)
- **Professional Dashboard**: Complete agent management with analytics, RAG documents, and call history
- **Agent Templates**: Pre-configured agents for different industries and languages
- **Tool Integration**: Calendar (Google/Outlook), CRM webhooks, and notifications (SMS/Email)
- **Swiss Compliance**: Data handling optimized for Swiss regulations (nDSG)

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Styling**: Tailwind CSS (Custom "Swiss" Theme), Framer Motion
- **3D**: Three.js, React Three Fiber (for Avatar visualization)
- **Routing**: React Router DOM v7+
- **Voice**: OpenAI Realtime API (ASR), ElevenLabs (TTS)
- **LLM**: OpenAI, Anthropic Claude, DeepSeek (configurable)
- **Vector DB**: Qdrant (for RAG)
- **Deployment**: Cloudflare Pages (Frontend), Railway/Render (Backend)

## 📂 Project Structure

```
src/
├── components/     # UI Components (Hero, Pricing, etc.)
│   └── layout/     # Layout components (ScrollToTop)
├── data/           # Static data (Features, Pricing, FAQ)
├── pages/          # Page views (LandingPage, OnboardingPage)
├── services/       # API services (aiService, demoService)
├── types.ts        # TypeScript definitions
├── App.tsx         # Main Application & Router
└── main.tsx        # Entry point
```

## ⚡ Getting Started

### Frontend

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   Create a `.env.local` file in the root (see `.env.example` for reference):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
   
   **WICHTIG:** Nur Variablen mit `VITE_`-Prefix sind im Client verfügbar!
   Vite baut nur Environment-Variablen ein, die mit `VITE_` beginnen.

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

### Backend API

1. **Navigate to server directory:**
   ```bash
   cd server
   npm install
   ```

2. **Set up Environment Variables:**
   Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your `ELEVENLABS_API_KEY`.

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Access API Documentation:**
   - Interactive Swagger UI: `http://localhost:5000/api-docs`
   - OpenAPI Spec: `http://localhost:5000/api-docs/swagger.json`

### Authentication
- Auth endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`
- Tokens: JWT access + refresh; store `auth_token` and `refresh_token`
- Protected backend routes now require `Authorization: Bearer <token>`
- Frontend uses `AuthProvider` + `ProtectedRoute` and axios interceptors for refresh

## 🎨 Design System

The project uses a custom Tailwind configuration (`tailwind.config.cjs`) with:
- **Colors**: `background` (#0E0E0E), `primary` (#1A73E8), `accent` (#00E0FF).
- **Fonts**: `Inter` (Body), `Space Grotesk` (Headlines).

## 🐳 Docker Deployment

See [DOCKER.md](DOCKER.md) for Docker setup and deployment instructions.

## 📚 Documentation

- **API Documentation**: Available at `/api-docs` when server is running
- **Deployment Guide**: See [DEPLOY.md](DEPLOY.md) for Cloudflare Pages setup
- **Docker Setup**: See [DOCKER.md](DOCKER.md)
- **Server API Docs**: See [server/API_DOCUMENTATION.md](server/API_DOCUMENTATION.md)
- **Voice Agent Service**: See [server/src/voice-agent/README.md](server/src/voice-agent/README.md)

## 🚀 Deployment

### Frontend Environment Variables (VITE_API_URL)

**WICHTIG:** Das Frontend benötigt die Environment-Variable `VITE_API_URL`, um zu wissen, wo das Backend läuft.

#### Development Setup

Erstelle eine `.env.local` Datei im Root-Verzeichnis:
```env
VITE_API_URL=http://localhost:5000/api
```

#### Production Deployment

Die `VITE_API_URL` **MUSS** in deinem Hosting-Service gesetzt werden, da sie während des Build-Prozesses eingebaut wird.

### Cloudflare Pages (Frontend)

1. Push code to GitHub
2. Connect repository to Cloudflare Pages
3. Build settings:
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
4. **Environment Variables** (KRITISCH):
   - Gehe zu: Dashboard → Workers & Pages → Dein Projekt
   - Settings → Environment Variables
   - **Add variable:**
     - Name: `VITE_API_URL`
     - Value: `https://your-backend-domain.com/api` (z.B. `https://real-aidevelo-ai.onrender.com/api`)
     - Environment: Production + Preview
   - **WICHTIG:** Nach Änderung der Environment Variables muss ein neuer Deploy getriggert werden!
5. Deploy automatically on push to `main`

**Backend URL Format:**
- Render: `https://your-app-name.onrender.com/api`
- Railway: `https://your-app-name.up.railway.app/api`
- Vercel: `https://your-app-name.vercel.app/api`

### Netlify (Frontend)

1. Connect repository to Netlify
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. **Environment Variables:**
   - Gehe zu: Site settings → Environment variables
   - **Add variable:**
     - Key: `VITE_API_URL`
     - Value: `https://your-backend-domain.com/api`
     - Scope: Production, Deploy previews, Branch deploys (je nach Bedarf)
   - **Redeploy** nach Änderung

### Vercel (Frontend)

1. Connect repository to Vercel
2. Build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables:**
   - Gehe zu: Project Settings → Environment Variables
   - **Add:**
     - Name: `VITE_API_URL`
     - Value: `https://your-backend-domain.com/api`
     - Environments: Production, Preview, Development (je nach Bedarf)
   - **Redeploy** nach Änderung

### Backend Deployment

Das Backend erwartet Requests mit dem `/api` Suffix. Stelle sicher, dass:
- Die Backend-URL mit `/api` endet (z.B. `https://your-backend.com/api`)
- Oder das Backend Requests ohne `/api` Prefix akzeptiert und entsprechend routet

Siehe [DEPLOY.md](DEPLOY.md) für detaillierte Backend-Deployment-Anweisungen.

### Verification nach Deployment

1. **Backend Health Check:**
   ```bash
   curl https://your-backend.com/health
   ```
   Sollte `{"status":"ok","timestamp":"..."}` zurückgeben.

2. **Frontend API Calls prüfen:**
   - Öffne Browser DevTools (F12) → Network Tab
   - Prüfe, dass API-Requests zur korrekten Backend-URL gehen
   - Keine Requests zu `127.0.0.1` oder `localhost` in Production!

3. **Console Errors:**
   - Prüfe Browser Console auf Fehler
   - Keine CORS-Errors oder 401-Fehler durch fehlende `VITE_API_URL`

## 🤝 Contributing

1. Ensure clean code structure (Service/Data separation).
2. Run standard formatted build before committing.
3. Follow the existing code style and patterns.