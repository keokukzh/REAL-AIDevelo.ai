# AIDevelo.ai Architecture

## Overview

AIDevelo.ai is a Swiss AI Voice Agent platform built as a monorepo with React frontend and Express backend.

## Project Structure

```
├── src/                    # Frontend (React 19 + Vite)
│   ├── components/         # UI Components
│   │   ├── ultra-landing/  # Landing page components
│   │   ├── voiceagent/     # Voice agent UI
│   │   ├── webdesign/      # Webdesign page components
│   │   ├── dashboard/      # Dashboard components
│   │   └── ui/             # Shared UI primitives
│   ├── pages/              # Route pages
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API client services
│   ├── contexts/           # React contexts (Auth, Theme)
│   ├── data/               # Static data (features, pricing)
│   ├── content/            # JSON content files
│   ├── lib/                # Utilities (analytics, supabase)
│   └── styles/             # CSS files
│
├── server/                 # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── controllers/    # Business logic controllers
│   │   ├── services/       # Service layer
│   │   ├── middleware/     # Express middleware
│   │   ├── voice-agent/    # Voice pipeline (ASR/LLM/TTS)
│   │   ├── config/         # Configuration
│   │   └── utils/          # Utility functions
│   ├── db/migrations/      # SQL migrations
│   └── tests/              # Backend tests
│
├── functions/              # Cloudflare Pages Functions (proxy)
├── public/                 # Static assets
├── infra/                  # Infrastructure configs (FreeSWITCH, nginx)
├── services/               # Microservices (ASR, TTS)
├── workflows/              # Workflow orchestrator CLI
├── tests/                  # E2E and framework tests
├── docs/                   # Documentation
│   ├── adr/                # Architecture Decision Records
│   └── user-flows/         # User journey documentation
└── shared/                 # Shared types between frontend/backend
```

## Entry Points

| Layer     | Entry Point                  | Description      |
| --------- | ---------------------------- | ---------------- |
| Frontend  | `src/index.tsx`              | React app entry  |
| Backend   | `server/src/app.ts`          | Express server   |
| Functions | `functions/api/[[splat]].ts` | Cloudflare proxy |

## Key Technologies

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js 20+, Express, TypeScript
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Voice**: OpenAI Realtime API, ElevenLabs TTS
- **Deployment**: Cloudflare Pages (frontend), Render (backend)

## Development Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint

# Backend
cd server
npm run dev          # Start API server
npm run build        # Compile TypeScript
npm run test:unit    # Run unit tests

# Full stack (Docker)
docker compose -f docker-compose.dev.yml up
```

## Environment Variables

See `.env.example` and `server/.env.example` for required environment variables.

Key variables:

- `VITE_API_URL` - Backend API URL (frontend)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` - Database
- `ELEVENLABS_API_KEY` - Voice synthesis
- `OPENAI_API_KEY` - LLM and ASR

## API Versioning

The backend serves routes at both:

- `/api/v1/*` (preferred)
- `/api/*` (compatibility, adds deprecation warning)

## Documentation

- [Deploy Guide](./DEPLOY.md)
- [User Guide](./USER_GUIDE.md)
- [Error Handling](./ERROR_HANDLING_GUIDE.md)
- [Supabase Security](./SUPABASE_SECURITY_HARDENING.md)
- [ADRs](./adr/) - Architecture Decision Records
