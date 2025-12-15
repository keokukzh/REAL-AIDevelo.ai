# Production Environment Variables

This document lists all environment variables required for production deployment of AIDevelo.ai.

## Required Variables

### Backend (API Server)

#### Authentication & Database
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `JWT_SECRET` - Secret key for JWT token signing (if using custom JWT)
- `TOKEN_ENCRYPTION_KEY` - 32-byte hex string for encrypting refresh tokens

#### Twilio Configuration
- `TWILIO_ACCOUNT_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_STREAM_TOKEN` - Token for Twilio Media Streams authentication (optional, for media streams feature)
- `ENABLE_MEDIA_STREAMS` - Set to `true` to enable Twilio Media Streams (default: `false`)

#### Google Calendar OAuth
- `GOOGLE_OAUTH_CLIENT_ID` - Google OAuth 2.0 Client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth 2.0 Client Secret

#### ElevenLabs Configuration
- `ELEVENLABS_API_KEY` - ElevenLabs API key for voice synthesis

#### Vector Database (Qdrant)
- `QDRANT_URL` - Qdrant server URL (e.g., `https://your-cluster.qdrant.io`)
- `QDRANT_API_KEY` - Qdrant API key (if using cloud)
- `OPENAI_API_KEY` - OpenAI API key for embeddings (used with Qdrant)

#### URLs & Deployment
- `PUBLIC_BASE_URL` - Public URL of the API server (e.g., `https://api.aidevelo.ai`)
- `FRONTEND_URL` - Public URL of the frontend (e.g., `https://aidevelo.ai`)
- `NODE_ENV` - Set to `production` for production deployments

#### Feature Flags
- `ENABLE_RAG` - Set to `true` to enable RAG features (default: `true`)
- `RAG_MAX_CHUNKS` - Maximum number of RAG chunks to inject (default: `5`)
- `RAG_MAX_CHARS` - Maximum characters of RAG context (default: `2500`)

### Frontend

#### API Configuration
- `VITE_API_URL` - Backend API URL (e.g., `https://api.aidevelo.ai`)
- `VITE_FRONTEND_URL` - Frontend URL (e.g., `https://aidevelo.ai`)

#### Supabase (Client)
- `VITE_SUPABASE_URL` - Supabase project URL (same as backend)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (for client-side auth)

## Optional Variables

### Development/Testing
- `DEV_BYPASS_AUTH` - Set to `true` in dev/test environments to bypass authentication (NEVER use in production)
- `LOG_LEVEL` - Logging level: `debug`, `info`, `warn`, `error` (default: `info`)

### Monitoring & Analytics
- `SENTRY_DSN` - Sentry DSN for error tracking (optional)
- `ANALYTICS_ID` - Analytics tracking ID (optional)

## Example Production Configuration

### Backend (.env)
```bash
NODE_ENV=production
PUBLIC_BASE_URL=https://api.aidevelo.ai
FRONTEND_URL=https://aidevelo.ai

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TOKEN_ENCRYPTION_KEY=your-32-byte-hex-key

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
ENABLE_MEDIA_STREAMS=true
TWILIO_STREAM_TOKEN=your-stream-token

GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret

ELEVENLABS_API_KEY=your-elevenlabs-key

QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key
OPENAI_API_KEY=your-openai-key

ENABLE_RAG=true
RAG_MAX_CHUNKS=5
RAG_MAX_CHARS=2500
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://api.aidevelo.ai
VITE_FRONTEND_URL=https://aidevelo.ai
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Security Notes

1. **Never commit** `.env` files to version control
2. **Rotate secrets** regularly, especially after team member changes
3. **Use different keys** for staging and production environments
4. **Restrict access** to environment variables in your hosting platform
5. **Monitor** for exposed secrets in logs or error messages

## Validation

Before deploying to production, verify all required variables are set:

```bash
# Backend validation
node -e "const required = ['SUPABASE_URL', 'PUBLIC_BASE_URL', 'TWILIO_ACCOUNT_SID']; required.forEach(v => { if (!process.env[v]) throw new Error(\`Missing: \${v}\`); });"

# Frontend validation (build time)
npm run build  # Will fail if required VITE_* vars are missing
```
