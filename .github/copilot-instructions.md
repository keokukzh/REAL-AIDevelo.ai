# Copilot Instructions – REAL-AIDevelo.ai

## Big picture
- Monorepo: React 19 + Vite frontend in `src/`, Express + TypeScript API in `server/`, plus a workflow orchestrator in `workflows/`.
- API versioning: backend mounts routes at `/api/v1/*` and keeps `/api/*` as a deprecated compatibility shim (see `server/src/app.ts`).
- Voice agent domain lives under `server/src/voice-agent/` (HTTP + WebSocket; ASR → LLM → TTS, with optional RAG/Qdrant).

## Day-to-day commands
- Full dev stack (backend, frontend, Postgres, Redis, Qdrant, Jaeger): `docker compose -f docker-compose.dev.yml up`
- Frontend only: `npm run dev` (Vite)
- API only: `cd server && npm run dev`
- Build: `npm run build` and `cd server && npm run build` (Node >= 20)
- Tests: `npm run test:unit`, `npm run test:e2e` (Playwright); API tests: `cd server && npm run test:unit` / `npm run test:integration`
- Migrations (compose runs this too): `cd server && npm run wait-and-migrate` (applies `server/db/migrations` in filename order)

## Auth + request shape
- Frontend auth uses Supabase (`src/contexts/AuthContext.tsx`). For protected API routes, send `Authorization: Bearer <Supabase access token>`; backend verifies via `server/src/middleware/supabaseAuth.ts`.
- Dev shortcut: set `DEV_BYPASS_AUTH=true` (never production) to seed a user/org/location and bypass JWT verification (`server/src/middleware/devBypassAuth.ts`).
- Frontend API calls go through Axios + `apiRequest()` (`src/services/api.ts`). Keep error responses shaped like `{ success: false, error: string }` so `ApiRequestError` behaves consistently.

## Backend conventions
- Prefer Supabase-backed flows for new work (e.g. default provisioning in `server/src/controllers/defaultAgentController.ts` + `server/src/services/supabaseDb.ts`). Legacy Postgres pool (`DATABASE_URL`) and the in-memory dev store (`server/src/services/db.ts`) still exist for older routes/demo flows.
- Add new endpoints under the versioned router (mounted in `server/src/app.ts`) and return `{ success, data }` on success.
- Twilio webhooks must validate `X-Twilio-Signature` using `server/src/middleware/verifyTwilioSignature.ts` (set `PUBLIC_BASE_URL` correctly behind proxies).
- Payments/Stripe are legacy/removed (see `server/src/config/env.ts`); avoid introducing new Stripe flows even if some docs/tags still mention “payments”.

## Useful entrypoints
- Frontend routing: `src/App.tsx`
- Backend bootstrap/middleware order: `server/src/app.ts`
- Voice Agent routes + WS setup: `server/src/voice-agent/routes/voiceAgentRoutes.ts`
