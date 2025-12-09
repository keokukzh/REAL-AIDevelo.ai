# AIDevelo.ai - Swiss AI Voice Agent Platform

Real-AIDevelo.ai is a high-end platform for Swiss SMEs to deploy autonomous AI Voice Agents.
The system provides 24/7 call handling, lead qualification, and appointment booking with a focus on Swiss High German / Dialect support and data privacy (nDSG).

## 🚀 Key Features

- **AI Voice Agent**: Natural-sounding, conversational AI (Google Gemini / VAPI powered).
- **Voice Cloning**: Clone your own voice for a digital twin experience.
- **Onboarding Wizard**: Step-by-step setup for companies (Hours, Objectives, Calendar).
- **Swiss Compliance**: Data handling optimized for Swiss regulations.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (Custom "Swiss" Theme), Framer Motion
- **3D**: Three.js, React Three Fiber (for Avatar visualization)
- **Routing**: React Router DOM v6+

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
   Create a `.env.local` file in the root:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

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

## 🎨 Design System

The project uses a custom Tailwind configuration (`tailwind.config.cjs`) with:
- **Colors**: `background` (#0E0E0E), `primary` (#1A73E8), `accent` (#00E0FF).
- **Fonts**: `Inter` (Body), `Space Grotesk` (Headlines).

## 🐳 Docker Deployment

See [DOCKER.md](DOCKER.md) for Docker setup and deployment instructions.

## 📚 Documentation

- **API Documentation**: Available at `/api-docs` when server is running
- **Docker Setup**: See [DOCKER.md](DOCKER.md)
- **Server API Docs**: See [server/API_DOCUMENTATION.md](server/API_DOCUMENTATION.md)

## 🤝 Contributing

1. Ensure clean code structure (Service/Data separation).
2. Run standard formatted build before committing.
3. Follow the existing code style and patterns.