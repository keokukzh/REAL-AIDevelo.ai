docker compose -f docker-compose.dev.yml up
git push origin main  # Triggers Railway build from server/Dockerfile
# Copilot Instructions – AIDevelo.ai

## Snapshot
- Frontend: React 19 + Vite + Tailwind + Framer Motion; React Router in `src/App.tsx`; 3D avatar via R3F `src/components/ThreeAvatar.tsx`.
- Backend: Express + TypeScript in `server/`; voice agent domain under `server/src/voice-agent` (RAG + ASR→LLM→TTS, Qdrant, ElevenLabs, OpenAI/Anthropic/DeepSeek).
- API shape: frontend uses `apiRequest` (`src/services/api.ts`), backend routes live in `server/src/routes` and are registered in `server/src/app.ts`; errors via `AppError` + `errorHandler`; rate limiter 100 req/15min on `/api/*`.

## Environments
- Frontend `.env.local`: `VITE_API_URL` (default `http://localhost:5000/api`), optional `VITE_DEBUG_API=true`.
- Backend `server/.env`: required in prod `ELEVENLABS_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; common `PORT`, `ALLOWED_ORIGINS`, `DATABASE_URL`, `REDIS_URL`, `QDRANT_URL`, `OTEL_EXPORTER_OTLP_ENDPOINT`; validation in `server/src/config/env.ts` fails fast in prod.

## Dev / Build / Test
- Frontend: `npm run dev` (:5173), `npm run build`, `npm run test` (Vitest). Chunking tuned in `vite.config.ts` (manualChunks, chunkSizeWarningLimit=1200).
- Backend: `cd server && npm run dev`, `npm run build`, migrations `npm run migrate` or `npm run wait-and-migrate`, ElevenLabs check `npm run test:elevenlabs`, OpenAPI `npm run docs:generate`.
- Compose stack: `docker compose -f docker-compose.dev.yml up` (backend, frontend, Postgres, Redis, Qdrant, Jaeger; runs wait-and-migrate). Health endpoints `/health`, `/health/ready`, `/metrics`.

## Frontend Conventions
- Keep CTAs real: onboarding route `/onboarding`, Calendly `https://calendly.com/aidevelo-enterprise`, demo anchor `#demo`; navbar scroll uses location state + 80px offset.
- Components live in `src/components`, pages in `src/pages`, data in `src/data`; forms (`LeadCaptureForm`, `EnterpriseContactForm`) already validated—reuse `apiRequest` for API calls.
- Styling is Tailwind; motion via Framer Motion; prefer mobile-first layouts and avoid dead links.

## Backend Conventions
- Routes under `server/src/routes`, registered in `app.ts`; document with `@swagger` JSDoc; errors throw `AppError` and fall through `errorHandler`.
- Voice agent entrypoints: HTTP `/api/voice-agent/query`, ingestion `/api/voice-agent/ingest`, WebSocket `/api/voice-agent/call-session`; see `server/src/voice-agent/{routes,rag,voice,llm,tools}` and README for pipeline details.
- Migrations: drop SQL files in `server/db/migrations` (filename-ordered). Compose auto-runs them; manually use `npm run migrate`.

## Deployment / CI
- Root `Dockerfile` builds frontend+backend multi-stage (serves backend on :5000 with `dist/` static); backend-only alt `server/Dockerfile`.
- GitHub Actions `.github/workflows/ci.yml`: FE test/build, BE build/OpenAPI, publish GHCR `ghcr.io/<owner>/aidevelo-api`; Cloudflare Pages deploy in `cloudflare-pages.yml`.
- Production targets: Frontend Cloudflare Pages (`wrangler.toml`), Backend Railway/Render/Fly; healthcheck `/health`.

## Workflows Package
- CLI in `workflows/`: `npm run workflow:run workflows/definitions/ci-cd-workflow.json`, `workflow:validate`, `workflow:monitor`, `workflow:status`; env toggles `DEPLOY_FRONTEND`, `DEPLOY_BACKEND`, `GENERATE_DOCS`.

## Key Files
- Frontend: `src/services/api.ts`, `src/hooks/useVoiceAgentChat.ts`, `src/pages/LandingPage.tsx`, `src/components/*` (Hero/Demo/Pricing).
- Backend: `server/src/app.ts`, `server/src/config/env.ts`, `server/src/middleware/errorHandler.ts`, `server/src/voice-agent/routes/voiceAgentRoutes.ts`.
- Ops: `docker-compose.dev.yml`, `railway.json`, `wrangler.toml`, `server/TRACING_SETUP.md`.

## Editing Guardrails
- Keep ASCII; maintain working routes/anchors/CTAs; align shared types (`src/types.ts` ↔ `server/src/models/types`). Run `npm run build` (root and `server/`) after build-critical changes.