# Railway Migration Fix — AIDevelo.ai

## Changes Applied

### 1. **Dockerfile** (`server/Dockerfile`)
- ✅ Added `COPY --from=base /app/node_modules ./node_modules` to production stage
  - This ensures `ts-node` and dependencies are available for running migrations in Railway
  - Previously: scripts weren't available at runtime, migrations failed silently

### 2. **railway.json**
- ✅ Changed `startCommand` from `node dist/app.js` to `sh -c 'npm run wait-and-migrate && node dist/app.js'`
  - Ensures migrations run **before** app startup
  - `wait-and-migrate` script waits for Postgres readiness + applies all migrations
  - If migrations fail, app won't start (fail-fast approach)

### 3. **docker-compose.dev.yml**
- ✅ Fixed build context: `context: .` (root) with `dockerfile: server/Dockerfile` (since root Dockerfile doesn't exist)
- ✅ Changed target from `tracing` (doesn't exist) to `base` (development stage)
- ✅ Command remains: `sh -c "npm run wait-and-migrate && npm run dev"`

## Migration Flow

### Local (Docker Compose)
```
1. Server container starts
2. Runs: npm run wait-and-migrate
   → Waits for Postgres TCP connection
   → Waits for Redis (optional)
   → Waits for Qdrant (optional)
   → Applies pending migrations from server/db/migrations/
   → Creates schema_migrations table to track applied migrations
3. Runs: npm run dev (Nodemon hot-reload)
```

### Railway Production
```
1. Docker image built (multi-stage: base → production)
2. Container starts with: sh -c 'npm run wait-and-migrate && node dist/app.js'
3. wait-and-migrate runs:
   → Connects to Railway Postgres (DATABASE_URL or DATABASE_PRIVATE_URL)
   → Applies pending SQL migrations
   → Exits with code 0 on success, 1 on failure
4. If success: Express app starts listening on :5000
5. Railway healthcheck: GET /health → 200 OK
```

## Verification Checklist

- [x] Local build passes: `npm run build` (frontend + backend)
- [x] Docker Compose startup passes migrations
- [x] Backend health endpoint responds: `curl http://localhost:5000/health` → 200 OK
- [x] Migrations applied successfully: `schema_migrations` table created + populated
- [x] All migration files executable: 001-005 in `server/db/migrations/`

## Troubleshooting Railway Deployment

### Issue: "schema_migrations table not created"
**Fix**: `wait-and-migrate` script auto-creates the table if missing.

### Issue: "Migration xxx failed"
**Check**: 
1. Railway logs: "Applied xxx_migration.sql"
2. Database credentials in Railway env vars: `DATABASE_URL` or `DATABASE_PRIVATE_URL`
3. SQL syntax in `server/db/migrations/*.sql`

### Issue: "Timeout waiting for Postgres"
**Check**:
1. Postgres service is connected in Railway
2. DATABASE_URL env var is set
3. Network policy allows container → Postgres connection

## Testing Production Setup Locally

```bash
# Simulate Railway production build
docker build -f server/Dockerfile --target production -t aidevelo-prod .

# Run with simulated Railway env vars
docker run -e DATABASE_URL="postgres://user:pass@host:5432/db" \
           -e NODE_ENV=production \
           -p 5000:5000 \
           aidevelo-prod

# Health check
curl http://localhost:5000/health
```

## Next Steps

1. **Deploy to Railway**: `git push origin main`
   - Railway will build using `server/Dockerfile`
   - Start command runs migrations + app
   - Healthcheck validates readiness

2. **Monitor**: Check Railway logs for migration success
   - Look for: `[migrations] All migrations processed`
   - Then: Express app logs show server listening on :5000

3. **Verify**: POST to `/api/voice-agent/query` or check `/api-docs`
