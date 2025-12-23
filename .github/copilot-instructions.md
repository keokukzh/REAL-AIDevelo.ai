# Copilot Instructions – REAL-AIDevelo.ai

## Repo shape (monorepo)
- Frontend: React 19 + Vite in `src/`
- Backend API: Express + TypeScript in `server/`
- Workflow orchestrator/CLI: `workflows/` (run via `npm run workflow:*`)

## Dev workflows (known-good commands)
- Full stack (API + Postgres/Redis/Qdrant/Jaeger): `docker compose -f docker-compose.dev.yml up`
- Frontend: `npm run dev`
- API: `cd server && npm run dev`
- Build: `npm run build` and `cd server && npm run build` (Node >= 20)
- Tests: `npm run test:unit`, `npm run test:e2e`; API tests: `cd server && npm run test:unit` / `npm run test:integration`
- Legacy migrations helper: `cd server && npm run wait-and-migrate` (applies `server/db/migrations` in filename order)

## API routing + versioning
- The backend mounts the same router at both:
	- `/api/v1/*` (preferred)
	- `/api/*` (compatibility shim that adds a deprecation warning header)
	See `server/src/app.ts`.
- The frontend’s default `API_BASE_URL` is `/api` in production (same-origin for CSP) and `http://localhost:5000/api` in dev (see `src/services/apiBase.ts`).
- Client calls should NOT include `/api` in the path (enforced by `npm run lint:api-prefix`); use paths like `/agents/123`.

## Auth (what’s actually used)
- Frontend auth is Supabase (`src/contexts/AuthContext.tsx`), and `src/services/apiClient.ts` injects `Authorization: Bearer <access_token>`.
- Backend auth for most protected routes is `verifySupabaseAuth` (`server/src/middleware/supabaseAuth.ts`).
- Dev shortcut:
	- Backend: `DEV_BYPASS_AUTH=true` (hard-disabled when `NODE_ENV=production`) seeds a user/org/location (`server/src/middleware/devBypassAuth.ts`).
	- Frontend: set `VITE_DEV_BYPASS_AUTH=true` to send a dummy token (`src/services/apiClient.ts`).
- Legacy JWT middleware still exists (`server/src/middleware/auth.ts`); prefer Supabase auth for new endpoints unless you’re extending legacy routes.

## Response shapes (so the frontend error handling works)
- Prefer `{ success: true, data }` on success and `{ success: false, error: string }` on errors so `src/services/api.ts` (`ApiRequestError`) surfaces errors consistently.

## Voice agent (HTTP + WebSocket)
- Voice agent domain: `server/src/voice-agent/` (RAG + realtime pipeline). HTTP routes live in `server/src/voice-agent/routes/voiceAgentRoutes.ts`.
- WebSocket server is wired via `setupWebSocketServer()` called from `server/src/app.ts`.
- RAG document endpoints are under `/rag` (`server/src/routes/ragRoutes.ts`); `/voice-agent/ingest` is marked legacy in code.

## Integrations / gotchas
- Twilio webhooks validate `X-Twilio-Signature` via `server/src/middleware/verifyTwilioSignature.ts`; set `PUBLIC_BASE_URL` correctly behind proxies.
- Observability is optional: `server/src/config/observability.ts` dynamically requires OpenTelemetry packages and no-ops if they’re not installed.
