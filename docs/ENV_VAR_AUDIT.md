# Environment Variable Audit

## A) Env Var Audit Table

### Server (Render) - Canonical List

| Var Name | Used In | Required? | Default | Notes |
|----------|---------|-----------|---------|-------|
| `NODE_ENV` | `env.ts`, `app.ts` | Yes | `development` | Runtime environment |
| `PORT` | `env.ts` | No | `5000` | Server port |
| `FRONTEND_URL` | `env.ts`, `calendarRoutes.ts` | No | `http://localhost:4000` | Frontend base URL |
| `PUBLIC_BASE_URL` | (Future: Twilio webhooks) | No | - | Public API base URL for webhooks |
| `SUPABASE_URL` | `env.ts`, `supabaseAuth.ts`, `supabaseDb.ts` | Yes (prod) | - | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `env.ts`, `supabaseAuth.ts`, `supabaseDb.ts` | Yes (prod) | - | Supabase service role key |
| `ELEVENLABS_API_KEY` | `env.ts` | Yes (prod) | - | ElevenLabs API key |
| `ELEVENLABS_AGENT_ID_DEFAULT` | `supabaseDb.ts` | No | - | Default ElevenLabs agent ID |
| `TOOL_SHARED_SECRET` | (Future: ElevenLabs tools) | No | - | Secret for tool webhooks |
| `TWILIO_ACCOUNT_SID` | `voice-agent/config.ts` | No | - | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | `voice-agent/config.ts` | No | - | Twilio auth token |
| `GOOGLE_OAUTH_CLIENT_ID` | `calendarService.ts`, `voice-agent/config.ts` | No | - | Google OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | `calendarService.ts`, `voice-agent/config.ts` | No | - | Google OAuth client secret |
| `GOOGLE_OAUTH_REDIRECT_URL` | (Future: OAuth callback) | No | - | Google OAuth redirect URL |
| `TOKEN_ENCRYPTION_KEY` | (Future: encrypted refresh tokens) | No | - | Encryption key for tokens |

### Legacy/Deprecated (Still Used, But Should Be Migrated)

| Var Name | Used In | Status | Migration Path |
|----------|---------|--------|----------------|
| `DATABASE_URL` | `database.ts`, `app.ts`, many repositories | **LEGACY** | Use Supabase client directly (already done for new endpoints) |
| `POSTGRES_URL` | `env.ts` (fallback) | **LEGACY** | Same as DATABASE_URL |
| `JWT_SECRET` | `authService.ts`, `env.ts` | **LEGACY** | Old auth routes still use JWT, but new routes use Supabase Auth |
| `JWT_REFRESH_SECRET` | `authService.ts`, `env.ts` | **LEGACY** | Same as JWT_SECRET |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `app.ts` (setupObservability) | **OPTIONAL** | Observability, can be removed if not used |
| `KNOWLEDGE_API_KEY` | `knowledgeRoutes.ts` | **OPTIONAL** | Knowledge base feature, keep if used |
| `REDIS_URL` | `env.ts` | **UNUSED** | Not referenced anywhere, can be removed |
| `ALLOWED_ORIGINS` | `env.ts` | **OPTIONAL** | Override CORS origins |

### Frontend (Cloudflare Pages) - Canonical List

| Var Name | Used In | Required? | Default | Notes |
|----------|---------|-----------|---------|-------|
| `VITE_API_URL` | `apiBase.ts` | Yes | - | Backend API URL |
| `VITE_SUPABASE_URL` | `supabase.ts` | Yes | - | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `supabase.ts` | Yes | - | Supabase anonymous key |

### Non-Standard Names Found (Need Migration)

| Current Name | Should Be | Used In |
|--------------|-----------|---------|
| `GOOGLE_CLIENT_ID` | `GOOGLE_OAUTH_CLIENT_ID` | `calendarService.ts` |
| `GOOGLE_CLIENT_SECRET` | `GOOGLE_OAUTH_CLIENT_SECRET` | `calendarService.ts` |
| `GOOGLE_CALENDAR_CLIENT_ID` | `GOOGLE_OAUTH_CLIENT_ID` | `voice-agent/config.ts` |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | `GOOGLE_OAUTH_CLIENT_SECRET` | `voice-agent/config.ts` |

