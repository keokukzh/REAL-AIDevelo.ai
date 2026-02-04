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
### 3. Hero Sections
- **Home**: `Hero.tsx` - Main landing experience.
- **Webdesign**: `HeroUltraAnimation.tsx` - **NEW** "Digital Dominance" 3D visualization using React Three Fiber.
  - Features: Procedural geometry, glowing emission shaders, floating particles.
  - Fallback: `HeroUltraFallback.tsx` for low-power devices/reduced motion.
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
   1. Install dependencies: `npm install`
   2. Start frontend: `npm run dev`
   3. Start API: `cd server && npm run dev`

   ### VS Code Setup
   - See [docs/setup/developer-setup.md](docs/setup/developer-setup.md) for recommended extensions and workspace configuration.
   - Tasks: Dev Server, Tests: Watch, and Lint available via Terminal > Run Task.

   ### Linting & Formatting
   - Run lint: `npm run lint`
   - Prettier settings are defined in `prettier.config.cjs` and applied on save via `.vscode/settings.json`.
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


## 📚 Documentation

### Getting Started
- **[docs/setup/setup.md](docs/setup/setup.md)** - Local development setup and environment variables
- **[docs/setup/developer-setup.md](docs/setup/developer-setup.md)** - VS Code setup and workspace configuration
- **[docs/setup/crewai-api-key.md](docs/setup/crewai-api-key.md)** - CrewAI API key setup
- **[docs/troubleshooting.md](docs/troubleshooting.md)** - Common issues and solutions

### Deployment & Operations
- **[docs/DEPLOY_QUICK_REFERENCE.md](docs/DEPLOY_QUICK_REFERENCE.md)** - ⚡ Quick reference for production deployment
- **[docs/DEPLOY.md](docs/DEPLOY.md)** - Deployment guide (Frontend: Cloudflare Pages, Backend: Render)
- **[docs/MERGE_TO_MAIN_AND_DEPLOY.md](docs/MERGE_TO_MAIN_AND_DEPLOY.md)** - Complete guide for merging to main and production deployment
- **[docs/PRE_MERGE_CHECKLIST.md](docs/PRE_MERGE_CHECKLIST.md)** - Pre-merge checklist and validation steps
- **API Documentation**: Available at `/api-docs` when server is running
- **Server API Docs**: See [server/API_DOCUMENTATION.md](server/API_DOCUMENTATION.md)
- **Voice Agent Service**: See [server/src/voice-agent/README.md](server/src/voice-agent/README.md)

### Additional Resources
- **[docs/mcp/README.md](docs/mcp/README.md)** - MCP (Model Context Protocol) documentation
- **[docs/reports/](docs/reports/)** - Audit reports and summaries
- **[docs/brainstorming/](docs/brainstorming/)** - Design brainstorming documents
- **[docs/design-concepts/](docs/design-concepts/)** - Design concept JSON files

### Superpowers Development Workflow

This project uses [Superpowers](https://github.com/obra/superpowers) - a structured development workflow framework for AI coding agents.

- **[docs/SUPERPOWERS_SETUP.md](docs/SUPERPOWERS_SETUP.md)** - Installation and setup guide
- **[docs/SUPERPOWERS_USAGE.md](docs/SUPERPOWERS_USAGE.md)** - Complete usage guide and examples
- **Skills Index**: `.agent/skills/INDEX.md` - Quick reference for all available skills
- **Workflow Guide**: `.agent/WORKFLOW.md` - Complete development workflow

The workflow enforces TDD, systematic debugging, and structured planning. See the documentation for details.

## 🚀 Deployment

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for complete deployment instructions:

- **Frontend**: Cloudflare Pages (build command, dist output, SPA routing, environment variables)
- **Backend**: Render (service configuration, environment variables, database setup)

### Production Release Process

For merging changes to main and deploying to production:

1. **Pre-Merge**: Follow the checklist in **[docs/PRE_MERGE_CHECKLIST.md](docs/PRE_MERGE_CHECKLIST.md)**
2. **Merge & Deploy**: See complete guide in **[docs/MERGE_TO_MAIN_AND_DEPLOY.md](docs/MERGE_TO_MAIN_AND_DEPLOY.md)**
3. **Automated Release**: Use GitHub Actions workflow "Production Release" for controlled deployments

## 🤝 Contributing

1. Ensure clean code structure (Service/Data separation).
2. Run standard formatted build before committing.
3. Follow the existing code style and patterns.
4. **Use Superpowers workflow** - Follow TDD, use skills for planning and debugging. See [docs/SUPERPOWERS_USAGE.md](docs/SUPERPOWERS_USAGE.md).