## AIDevelo.ai – AI Agent Development Guide

### Architecture Overview
**Frontend**: React 19 + Vite (`src/App.tsx`) with React Router, Tailwind CSS, Framer Motion animations, and React Three Fiber for 3D avatars.  
**Backend**: Express + TypeScript (`server/src/app.ts`) exposing REST API with Swagger docs, WebSocket for real-time voice, and background job processing.  
**Voice Agent**: Domain lives in `server/src/voice-agent/` with RAG pipeline (Qdrant vector store), LLM provider abstraction (OpenAI/Anthropic/Google), tool registry for calendar/CRM integration, and WebSocket audio pipeline (ASR→LLM→TTS via ElevenLabs).

### Environment Configuration
**Frontend** (root `.env.local`):
- `VITE_API_URL` - API endpoint (default: `http://localhost:5000/api`, production: Railway backend URL)
- `VITE_DEBUG_API=true` - Enable API request logging in dev

**Backend** (`server/.env`):
- **Required in production**: `ELEVENLABS_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Optional with defaults**: `PORT` (5000), `NODE_ENV` (development), `ALLOWED_ORIGINS` (comma-separated), `DATABASE_URL`, `REDIS_URL`, `QDRANT_URL`, `OTEL_EXPORTER_OTLP_ENDPOINT`
- Validation in `server/src/config/env.ts` - fails fast in production if secrets missing, warns in dev

### Development Workflows

#### Local Development (Standalone)
```bash
# Frontend (root)
npm install && npm run dev              # Vite dev server on :5173

# Backend (server/)
cd server
npm install && npm run dev              # Nodemon hot-reload on :5000
npm run docs:generate                   # Generate OpenAPI spec
npm run test:elevenlabs                 # Test ElevenLabs TTS integration
```

#### Docker Compose Dev Stack (Recommended)
```bash
# From repo root - starts all services with auto-migration
docker compose -f docker-compose.dev.yml up

# Services: server (:5000), frontend (:5173), postgres (:5432), 
#           redis (:6379), qdrant (:6333), jaeger (:16686)
# Server waits for DB readiness, runs migrations, then starts with hot-reload
```

**Migration workflow**: SQL files in `server/db/migrations/` applied in order; tracked in `_prisma_migrations` table.
- `npm run migrate` - Apply migrations only
- `npm run wait-and-migrate` - Wait for services + apply migrations

#### Testing & Debugging
```bash
# Frontend tests
npm run test                            # Vitest
npm run test:watch                      # Watch mode
npm run test:coverage                   # Coverage report in coverage/

# Backend debugging
curl -X POST http://localhost:5000/api/voice-agent/query \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Check health endpoints
http://localhost:5000/health            # Liveness
http://localhost:5000/health/ready      # Dependencies check (Postgres/Redis/Qdrant)
http://localhost:5000/metrics           # Observability metrics
```

**Common issues**:
- 429/403 errors: Rate limiter (100 req/15min on `/api/*`) or CORS rejection (check `ALLOWED_ORIGINS`)
- Frontend can't reach API: Verify `VITE_API_URL` matches backend port and backend is running
- WebSocket errors: Ensure port 5000 accessible for `/api/voice-agent/call-session` endpoint

### Deployment

**Production Stack**:
- Frontend: Cloudflare Pages (`wrangler.toml` configures `VITE_API_URL`)
- Backend: Railway (`railway.json` specifies Dockerfile path, healthcheck, startup command)
- Databases: Railway-hosted Postgres + Redis; Qdrant Cloud for vector storage
- Payments: Stripe (webhook listener via Stripe CLI locally)

**Deploy Commands**:
```bash
# Frontend to Cloudflare Pages
CF_PAGES_PROJECT_NAME=real-aidevelo-ai npm run deploy:cf

# Backend auto-deploys on git push to Railway
git push origin main  # Triggers Railway build from server/Dockerfile
```

**Dockerfile stages** (`server/Dockerfile`):
- `base` - Build TypeScript, install deps
- `production` - Production runtime (copies `dist/` and `db/` from base)
- `tracing` - Optional OpenTelemetry instrumentation (extend `base` with OTEL packages)

**Railway config** (`railway.json`):
```json
{
  "build": { "dockerfilePath": "server/Dockerfile", "buildEnvironment": "V3" },
  "deploy": { "startCommand": "node dist/app.js", "healthcheckPath": "/health" }
}
```

### Code Patterns & Conventions

**Frontend API Calls**:
- Use `apiRequest<T>()` from `src/services/api.ts` - handles base URL, JSON parsing, typed errors
- Throws `ApiRequestError` with statusCode/details for network failures
- Voice chat: `useVoiceAgentChat` hook posts to `/voice-agent/query`, handles optimistic UI updates

**Backend API Routes**:
- All routes in `server/src/routes/`, registered in `app.ts` under `/api/*`
- Use middleware: `attachApiVersionHeader` (X-API-Version), `deprecationWarningMiddleware`, rate limiter
- Error handling: Throw `AppError` with code/status; caught by `errorHandler` middleware (returns structured JSON)
- Swagger annotations: Document endpoints with `@swagger` JSDoc comments (served at `/api-docs`)

**Voice Agent Pipeline** (`server/src/voice-agent/`):
1. HTTP: `POST /api/voice-agent/query` → RAG retrieval (Qdrant) → LLM prompt → Tool execution → Response
2. WebSocket: `/api/voice-agent/call-session` → `VoicePipelineHandler` streams audio (ASR→LLM→TTS loop)
3. Tools: Registry in `tools/toolRegistry.ts` wraps calendar/CRM/notifications; definitions passed to LLM for function calling

**Styling**:
- Tailwind config: `tailwind.config.cjs` with custom colors (`background`/`primary`/`accent`), fonts (Inter/Space Grotesk)
- Components: `src/components/*` for shared UI, `src/pages/*` for route components
- Animations: Framer Motion for transitions, React Three Fiber for 3D avatar (`src/components/ThreeAvatar.tsx`)

**Type Safety**:
- Shared types: `src/types.ts` (frontend) and `server/src/models/types` (backend) - keep aligned
- Validation: Zod schemas in `server/src/validators/`

**Observability**:
- OpenTelemetry setup in `server/src/config/observability.ts` - dynamically loads OTEL packages (no-op fallback if missing)
- Traces exported to Jaeger (default `http://localhost:4318` or `OTEL_EXPORTER_OTLP_ENDPOINT`)
- Metrics endpoint: `/metrics`

### Workflow Automation
**Workflows package** (`workflows/`): JSON workflow orchestrator with CLI.
```bash
npm run workflow:run <definition-file>    # Execute workflow
npm run workflow:validate <file>          # Validate JSON schema
npm run workflow:status                   # Check running workflows
```
Example: `workflows/definitions/ci-cd-workflow.json` for automated deployment tasks.

### Key Files Reference
- `server/src/app.ts` - Express app setup, middleware, route registration
- `server/src/config/env.ts` - Environment validation and config exports
- `server/src/middleware/errorHandler.ts` - Centralized error formatting
- `src/services/api.ts` - Frontend API request wrapper
- `server/src/voice-agent/routes/voiceAgentRoutes.ts` - Voice agent endpoints + WebSocket handler
- `docker-compose.dev.yml` - Full dev stack orchestration
- `railway.json` + `wrangler.toml` - Production deployment configs

### Development Tips
- **Adding new API route**: Create in `server/src/routes/`, import and register in `app.ts`, add Swagger docs, create client call via `apiRequest` in frontend
- **Database changes**: Add SQL file to `server/db/migrations/`, filename must sort after existing; run `npm run migrate` in server/
- **CORS issues**: Add origin to `ALLOWED_ORIGINS` env var (comma-separated) or update `config.allowedOrigins` in `env.ts`
- **React 19 peer deps**: Use `npm install --legacy-peer-deps` if encountering conflicts (e.g., @react-spring/three, react-helmet-async)
- **Debugging Railway deploys**: Check logs in Railway dashboard, verify `railway.json` config, ensure all env vars set (especially secrets)

**Ask for clarification if uncertain about integration points or workflows - otherwise proceed with these patterns.**