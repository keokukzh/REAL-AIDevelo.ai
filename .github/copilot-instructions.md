docker compose -f docker-compose.dev.yml up
git push origin main  # Triggers Railway build from server/Dockerfile

# Copilot Instructions – AIDevelo.ai

## Snapshot
- **Frontend**: React 19 + Vite + Tailwind + Framer Motion; React Router in `src/App.tsx`; Dashboard with default agent auto-provisioning.
- **Backend**: Express + TypeScript in `server/`; **voice agent domain** under `server/src/voice-agent` (RAG + ASR→LLM→TTS, Qdrant, ElevenLabs, OpenAI/Anthropic/DeepSeek); **Agent management** via repositories + services; **Default agent provisioning** for first-time users.
- **API shape**: frontend uses `apiRequest` (`src/services/api.ts`), backend routes registered in `server/src/app.ts`; errors via `AppError` + `errorHandler`; rate limiter 100 req/15min on `/api/*`.
- **Database**: Postgres (Railway) + mock fallback; repositories in `server/src/repositories/` use dual-write pattern (DB + in-memory).

## Environments
- **Frontend** `.env.local`: `VITE_API_URL` (default `http://localhost:5000/api`), optional `VITE_DEBUG_API=true`.
- **Backend** `server/.env`: required in prod `ELEVENLABS_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; common `PORT`, `ALLOWED_ORIGINS`, `DATABASE_URL`, `REDIS_URL`, `QDRANT_URL`, `OTEL_EXPORTER_OTLP_ENDPOINT`; validation in `server/src/config/env.ts` fails fast in prod.

## Dev / Build / Test
- **Frontend**: `npm run dev` (:4000), `npm run build`, `npm run test` (Vitest). Chunking tuned in `vite.config.ts` (manualChunks, chunkSizeWarningLimit=1200).
- **Backend**: `cd server && npm run dev`, `npm run build`, migrations `npm run migrate` or `npm run wait-and-migrate`, ElevenLabs check `npm run test:elevenlabs`, OpenAPI `npm run docs:generate`.
- **Compose stack**: `docker compose -f docker-compose.dev.yml up` (backend, frontend, Postgres, Redis, Qdrant, Jaeger; runs wait-and-migrate). Health endpoints `/health`, `/health/ready`, `/metrics`.

## Critical Patterns

### Default Agent Auto-Provisioning
- **Frontend** (`DashboardPage.tsx`): `ensureDefaultAgent()` runs once on mount → calls `/agents/default` POST.
- **Backend** (`agentController.ts` → `defaultAgentService.ts`): Creates agent from template if none exists; checks via `hasDefaultAgent(userId)`.
- **Persistence**: `userRepository.upsertUser()` (Postgres) + `db.saveAgent()` (mock store) to keep both in sync.
- **Important**: Default agent marked with `metadata.isDefaultAgent = true` for filtering/UI badges.

### Repository Pattern (DB Layer)
- **Location**: `server/src/repositories/{userRepository, telephonyRepository, ...}`
- **Pattern**: Check `getPool()` before DB ops; fallback to mock store (`db.*`) if no pool.
- **Example**: `userRepository.upsertUser()` inserts/updates with email conflict resolution, returns typed `User` object.
- **Persistence**: Call `persistAgent()` in services to save to Postgres; always sync mock store.

### Frontend Routing & Navigation
- **Route structure**: `/dashboard`, `/dashboard/agents/:id` (details), `/dashboard/agents/:id/edit` (config).
- **Page components**: `DashboardPage`, `AgentDetailsPage`, `AgentEditPage` in `src/pages/`.
- **Cards & Lists**: `AgentCard` (grid/list view) links to `/dashboard/agents/${agent.id}` (details).
- **Action buttons**: Edit button calls `navigate('/dashboard/agents/:id/edit')`.
- **Critical**: All CTAs must have real routes; test nav flow after adding new pages.

### UI Components & Dashboard Cards
- **Dashboard stats**: `KPIOverview` shows activeAgents, totalAgents, callsToday, successRate.
- **Agent cards**: Grid/list view via `AgentCard`; status badges (draft/active/inactive/pending).
- **Default agent**: Marked with blue "Standard-Agent" badge; appears first in list.
- **Loading states**: Use `<RefreshCw className="animate-spin" />` with messaging ("Lade Dashboard..." / "Ihr Agent wird vorbereitet...").

### System Prompts & Agent Templates
- **File**: `server/src/data/defaultAgentTemplate.ts` → `DEFAULT_AGENT_TEMPLATE`.
- **Structure**: businessProfile (company name, industry, location), config (voice ID, system prompt, locales).
- **Template system prompt**: Professional German Swiss tone; 24/7 lead qualification & support; clear role definition.
- **Voice**: Default is Adam (pNInz6obpgDQGcFmaJgB) - professional male, de-CH.

## Frontend Conventions
- **Keep CTAs real**: onboarding `/onboarding`, details `/dashboard/agents/:id`, edit `/dashboard/agents/:id/edit`; no dead links.
- **Component layout**: `src/components/{dashboard/, agent/, ui/}` for specialized areas; reusable `Button`, `Toast`, form components in `ui/`.
- **Forms**: Always validate before submit; use `apiRequest` for API calls; handle `ApiRequestError` with 409 (conflict) checks.
- **Styling**: Tailwind + Framer Motion; mobile-first; prefer `group-hover:opacity-100` for secondary actions.
- **State management**: useState + custom hooks (e.g., `useVoiceAgentChat`); keep state close to usage.

## Backend Conventions
- **Routes**: Under `server/src/routes/`, registered in `app.ts`; document with `@swagger` JSDoc comments.
- **Controllers**: Handle HTTP layer; call services for business logic.
- **Services**: Contain business logic (e.g., `defaultAgentService.provisionDefaultAgent()`).
- **Errors**: Throw `AppError` or custom errors; fall through `errorHandler` middleware for consistent JSON responses.
- **Voice agent**: HTTP `/api/agents`, WebSocket `/api/voice-agent/call-session`; see `voice-agent/{routes,rag,voice,llm}` for pipeline.
- **Migrations**: Drop SQL files in `server/db/migrations` (filename-ordered). Compose auto-runs via `npm run wait-and-migrate`.

## Deployment / CI
- **Root Dockerfile**: Multi-stage build (frontend + backend on :5000); serves `dist/` as static.
- **Backend Dockerfile**: `server/Dockerfile` for backend-only deployments.
- **GitHub Actions** (`.github/workflows/ci.yml`): FE test/build, BE build/OpenAPI, GHCR push.
- **Cloudflare Pages**: Frontend via `wrangler.toml`; Backend on Railway/Render/Fly.
- **Health**: All services expose `/health`, `/health/ready`, `/metrics`.

## Key Files & Patterns
- **Frontend**: `src/services/api.ts` (HTTP client), `src/pages/DashboardPage.tsx` (agent list + default provisioning), `src/components/dashboard/AgentCard.tsx` (card UI).
- **Backend**: `server/src/app.ts` (bootstrap), `server/src/controllers/agentController.ts` (CRUD), `server/src/services/defaultAgentService.ts` (auto-provision), `server/src/repositories/userRepository.ts` (DB layer).
- **Config**: `server/src/config/env.ts` (validation), `server/src/data/defaultAgentTemplate.ts` (templates).
- **Ops**: `docker-compose.dev.yml`, `railway.json`, `server/TRACING_SETUP.md`.

## Editing Guardrails
- **Types**: Frontend types in `src/types.ts`; backend types in `server/src/models/types.ts`. Keep in sync for shared interfaces (Agent, User).
- **Routing**: After adding routes, test full flow (component → navigate → page → API call). Verify no circular imports.
- **API**: Ensure error responses match `{ success: false, error: string }` shape for `apiRequest` error handling.
- **Database**: New queries must check `getPool()` before executing; provide mock fallback in `db.*`.
- **Migrations**: Add migrations before schema changes; run `npm run wait-and-migrate` locally to validate.
- **Build**: Run `npm run build` (root) and `npm run build` (server/) after structural changes; validate bundle size in vite.config.ts.
- **Tests**: All 11 tests must pass (`npm run test -- --run`); fix broken tests immediately.
