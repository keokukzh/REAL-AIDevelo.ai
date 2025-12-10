# 🚀 Railway Deployment Checklist – AIDevelo.ai

## Issue Summary
Backend migrations waren nicht automatisch on Railway ausgeführt worden. Die App startete, aber Datenbank-Schema war leer.

## Root Causes Fixed

| Issue | Ursache | Fix |
|-------|--------|-----|
| **Migrations liefen nicht** | `startCommand` war nur `node dist/app.js`, keine Migration-Ausführung | → `sh -c 'npm run wait-and-migrate && node dist/app.js'` |
| **ts-node nicht im Image** | Production-Stage kopierte `node_modules` nicht | → Hinzugefügt: `COPY --from=base /app/node_modules ./node_modules` |
| **Docker Compose fehlgeschlagen** | Build referenzierte nicht-existente `tracing` stage | → Geändert zu `base` stage |
| **Compose falscher Context** | Build context war `./server` (falsch für multi-stage) | → Geändert zu `.` (root) |

---

## Pre-Deployment Checklist

### ✅ Code Changes
- [x] `server/Dockerfile` — Production stage includes node_modules
- [x] `railway.json` — startCommand runs migrations first
- [x] `docker-compose.dev.yml` — Correct build context & target stage
- [x] All migration files present in `server/db/migrations/` (001-005)

### ✅ Build Verification
```bash
# Frontend
npm run build           # ✓ Builds to dist/
# Backend
cd server && npm run build  # ✓ Compiles to dist/
```

### ✅ Local Docker Test
```bash
docker compose -f docker-compose.dev.yml up
# Expected: migrations applied, server starts, responds to /health
```

### ✅ Production Docker Build
```bash
docker build -f server/Dockerfile --target production -t aidevelo-prod .
# Expected: Image builds successfully with node_modules included
```

---

## Railway Deployment Steps

### 1️⃣ Ensure Railway Services Are Connected
- [ ] **Postgres database** connected to project
- [ ] Environment variables set:
  - [ ] `DATABASE_URL` or `DATABASE_PRIVATE_URL` (Railway auto-creates)
  - [ ] `ELEVENLABS_API_KEY` (required for production)
  - [ ] `STRIPE_SECRET_KEY` (required for production)
  - [ ] `STRIPE_WEBHOOK_SECRET` (required for production)
  - [ ] `NODE_ENV=production`
  - [ ] Optional: `QDRANT_URL`, `REDIS_URL`, `ALLOWED_ORIGINS`

### 2️⃣ Deploy Code
```bash
git push origin main
```
→ Railway will:
1. Clone repo
2. Build using `server/Dockerfile`
3. Run: `sh -c 'npm run wait-and-migrate && node dist/app.js'`

### 3️⃣ Monitor Deployment

**Railway Dashboard**:
- Go to your backend service
- Click "Deployments" tab
- Watch live logs for:
  ```
  [wait] Waiting for Postgres...
  [wait] Postgres is available
  [migrations] Using DATABASE_URL: postgres://...
  [migrations] Applying 002_create_agents_table.sql...
  [migrations] Applied 002_create_agents_table.sql
  [migrations] All migrations processed
  [wait] Done — migrations complete
  > aidevelo-api@1.0.0 start
  > node dist/app.js
  ```

### 4️⃣ Verify Deployment
```bash
# Test health endpoint (replace with your Railway domain)
curl https://aidevelo-api-prod.railway.app/health

# Expected response:
# {"status":"ok","timestamp":"2025-12-11T..."}

# Test API
curl https://aidevelo-api-prod.railway.app/api/voice-agent/query \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"customerId":"test","query":"hello"}'
```

---

## Troubleshooting Railway Logs

### ⚠️ "Migration failed: permission denied"
→ Check Postgres credentials in `DATABASE_URL`

### ⚠️ "Timeout waiting for Postgres"
→ Postgres service might not be started/connected in Railway; check project services

### ⚠️ "Missing required env variables: ELEVENLABS_API_KEY"
→ Set all production secrets in Railway env vars (expected behavior)

### ⚠️ App crashes after migrations
→ Check `dist/` exists and contains compiled `.js` files
→ Run `npm run build` locally and commit `dist/`

### ✅ Migrations already applied
→ Expected on redeploys; script skips already-applied migrations (tracked in `schema_migrations` table)

---

## Rollback / Disaster Recovery

If migrations corrupt data:

1. **Stop deployment** in Railway
2. **Restore database backup** (Railway keeps snapshots)
3. **Delete failed migrations** from `server/db/migrations/` if needed
4. **Redeploy**: `git push origin main`

---

## Key Files Reference

- **Dockerfile**: `server/Dockerfile` — Multi-stage build (base + production)
- **Start script**: `server/scripts/waitAndMigrate.ts` — Waits for services + runs migrations
- **Migration runner**: `server/scripts/runMigrations.ts` — Reads & applies SQL files
- **Migrations dir**: `server/db/migrations/` — SQL files (001-005)
- **Railway config**: `railway.json` — Deployment settings & startCommand
- **Compose file**: `docker-compose.dev.yml` — Local dev stack

---

## Next Monitoring Steps

After successful deployment:

1. **Set up alerts**:
   - Health endpoint down → alert
   - High error rate on `/api/*` → alert

2. **Log aggregation**:
   - Railway logs → export to ELK or CloudWatch

3. **Database monitoring**:
   - Monitor `schema_migrations` table for new entries
   - Watch Postgres CPU/memory usage

---

## Timeline

- **Dec 11, 2025**: Migration fixes implemented
- **Local verification**: ✅ Compose test passed, migrations applied
- **Production build**: ✅ Docker multi-stage image builds successfully
- **Next**: Deploy to Railway and verify end-to-end
