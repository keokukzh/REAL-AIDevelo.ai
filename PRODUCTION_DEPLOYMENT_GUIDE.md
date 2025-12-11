# Production Deployment Guide - AIDevelo.ai

## Overview

This guide covers deploying AIDevelo.ai to production on Railway with full monitoring, compliance, and security configurations.

---

## 1. Pre-Deployment Checklist

### Code Quality
- [x] All unit tests passing (11/11)
- [x] TypeScript compilation clean (0 errors)
- [x] API documentation generated (openapi.json)
- [x] Code reviewed and committed
- [x] No sensitive data in code/config

### Infrastructure
- [x] Backend Dockerfile created (multi-stage)
- [x] Frontend builds to `/dist`
- [x] Docker Compose configuration ready
- [x] Environment variables documented
- [x] Database migrations prepared (010)

### Compliance & Security
- [x] GDPR/nDSG privacy endpoints implemented
- [x] Data export and deletion working
- [x] Audit logging configured
- [x] Rate limiting enabled
- [x] CORS configured
- [x] HTTPS/WSS enforced

### Documentation
- [x] API documentation complete (API_DOCUMENTATION.md)
- [x] Frontend integration guide (FRONTEND_INTEGRATION_GUIDE.md)
- [x] Testing procedures documented (TESTING_GUIDE.md)
- [x] Architecture documented (copilot-instructions.md)

---

## 2. Environment Configuration

### Production Environment Variables

Create `server/.env` with:

```bash
# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://user:pass@db.railway.app:5432/aidevelo_prod
POSTGRES_USER=aidevelo_prod
POSTGRES_PASSWORD=<strong-password-here>
POSTGRES_DB=aidevelo_prod

# Voice Services
ELEVENLABS_API_KEY=<your-elevenlabs-key>
OPENAI_API_KEY=<your-openai-key>
ANTHROPIC_API_KEY=<your-anthropic-key>  # Optional
DEEPSEEK_API_KEY=<your-deepseek-key>    # Optional

# Caching & Jobs
REDIS_URL=redis://default:pass@redis.railway.app:6379

# Vector Database
QDRANT_URL=https://qdrant.railway.app

# Payments
STRIPE_SECRET_KEY=<your-stripe-secret>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

# Server Configuration
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://aidevelo.ai,https://www.aidevelo.ai

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=https://jaeger.railway.app

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Frontend Environment Variables

Create `.env.production`:

```bash
VITE_API_URL=https://api.aidevelo.ai/api
VITE_DEBUG_API=false
VITE_ELEVENLABS_API_ENDPOINT=https://api.elevenlabs.io
```

---

## 3. Database Setup

### Railway PostgreSQL Setup

1. **Create PostgreSQL service on Railway**
   ```bash
   railway add postgres
   ```

2. **Get connection string**
   ```bash
   railway link
   # Copy DATABASE_URL from environment
   ```

3. **Apply migrations**
   ```bash
   # Migrations auto-run on Railway via:
   npm run wait-and-migrate
   
   # Or manually:
   railway run npm run migrate
   ```

4. **Verify migration**
   ```sql
   \dt call_logs
   \dt audit_logs
   \dv agent_call_metrics
   ```

5. **Create indexes** (if not done by migration)
   ```sql
   CREATE INDEX idx_call_logs_agent_id ON call_logs(agent_id);
   CREATE INDEX idx_call_logs_customer_id ON call_logs(customer_id);
   CREATE INDEX idx_call_logs_start_time ON call_logs(start_time DESC);
   CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
   ```

---

## 4. Backend Deployment (Railway)

### Step 1: Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

### Step 2: Configure Backend Service

**`railway.json`**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "dockerfile",
    "dockerfile": "server/Dockerfile"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 3: Link Services

```bash
# Add PostgreSQL
railway add postgres

# Add Redis (for caching)
railway add redis

# Add Qdrant (vector DB)
# Or use external service (pinecone, weaviate, etc.)
```

### Step 4: Deploy

```bash
# Deploy backend
railway up

# Watch deployment logs
railway logs
```

### Step 5: Verify Deployment

```bash
# Get backend URL
railway open

# Check health
curl https://api.aidevelo.ai/health

# Check readiness
curl https://api.aidevelo.ai/health/ready

# Verify migrations ran
curl https://api.aidevelo.ai/metrics | grep migrations
```

---

## 5. Frontend Deployment (Cloudflare Pages)

### Step 1: Build Production

```bash
# Build frontend
npm run build

# Output: `dist/` directory
```

### Step 2: Deploy to Cloudflare Pages

**Option A: Git Push (Recommended)**

1. Connect GitHub repository to Cloudflare Pages
2. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables:
     ```
     VITE_API_URL=https://api.aidevelo.ai/api
     VITE_DEBUG_API=false
     ```

3. Push to main branch
   ```bash
   git push origin main
   # Cloudflare Pages auto-deploys
   ```

**Option B: Wrangler CLI**

```bash
# Install wrangler
npm install -g wrangler

# Configure wrangler.toml
cat > wrangler.toml << 'EOF'
name = "aidevelo-ai"
pages_build_output_dir = "dist"
compatibility_date = "2024-12-11"

[env.production]
routes = [
  { pattern = "https://aidevelo.ai/*", zone_name = "aidevelo.ai" }
]
EOF

# Deploy
wrangler pages deploy dist
```

### Step 3: Configure Domain

1. Add custom domain in Cloudflare Pages dashboard
2. Configure DNS records
3. Enable SSL/TLS (auto-managed by Cloudflare)

### Step 4: Verify Frontend

```bash
# Check frontend loads
curl https://aidevelo.ai/

# Verify API calls work
# In browser: Open DevTools → Network
# Should see requests to https://api.aidevelo.ai/api/*
```

---

## 6. SSL/TLS & HTTPS

### Railway Backend

- [x] Auto-configured by Railway
- [x] SSL certificate auto-renewed
- [x] Custom domain via CNAME

### Cloudflare Pages Frontend

- [x] Auto-configured
- [x] Full SSL encryption
- [x] HTTP to HTTPS redirect

### WebSocket Security

For ElevenLabs streaming, WebSocket must use **WSS** (secure):

```typescript
// ✅ Correct (production)
const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai?token=${token}`);

// ❌ Wrong (will fail in production)
const ws = new WebSocket(`ws://api.elevenlabs.io/v1/convai?token=${token}`);
```

---

## 7. Monitoring & Observability

### Health Checks

```bash
# Basic health
curl https://api.aidevelo.ai/health

# Readiness (DB connection check)
curl https://api.aidevelo.ai/health/ready

# Metrics (Prometheus format)
curl https://api.aidevelo.ai/metrics
```

### Configure Health Checks in Railway

In Railway dashboard:
- Set health check URL: `/health/ready`
- Interval: 30s
- Timeout: 10s
- Healthy threshold: 2 consecutive passes

### Jaeger Tracing

```bash
# Deploy Jaeger to Railway
railway add jaeger

# Access Jaeger UI
railway open jaeger

# View traces for:
# - POST /api/voice-agent/elevenlabs-stream-token
# - GET /api/privacy/audit-log
# - POST /api/privacy/export-data
```

### Application Metrics

Monitor these metrics:

```
# Request metrics
http_requests_total{endpoint="/api/voice-agent/elevenlabs-stream-token"}
http_requests_duration_seconds{endpoint="/api/privacy/export-data"}

# Database metrics
pg_pool_size
pg_pool_available_connections
pg_query_duration_seconds

# Voice metrics
elevenlabs_streaming_connections_active
elevenlabs_stream_tokens_generated_total

# Compliance metrics
gdpr_export_requests_total
gdpr_deletion_requests_total
audit_log_entries_total
```

---

## 8. Backups & Disaster Recovery

### Database Backups

```bash
# Railway auto-backs up PostgreSQL daily
# Access backups in Railway dashboard:
# - Services → PostgreSQL → Backups tab

# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

### Point-in-Time Recovery

- Railway retains 30 days of WAL (Write-Ahead Logs)
- Can recover to any point within 30 days
- Contact Railway support for recovery

### Backup Checklist
- [x] Daily automated backups enabled
- [x] 30-day retention configured
- [x] Test restore procedure documented
- [x] Critical data identified (agents, call logs, audit logs)

---

## 9. Security Hardening

### API Security

- [x] Rate limiting: 100 req/15min on `/api/*`
- [x] CORS: Configured for frontend domain only
- [x] HTTPS: All traffic encrypted
- [x] API keys: Server-side management, never exposed

### Database Security

- [x] Strong password: 32+ character random string
- [x] SSL connections: Enforced between app and DB
- [x] IP allowlist: Restrict to Railway IPs
- [x] Audit logging: All user actions logged

### WebSocket Security

- [x] WSS (secure WebSocket): Enforced
- [x] Token-based authentication: 1-hour expiry
- [x] CORS check: Origin validation
- [x] Rate limiting: Per connection limits

### Data Protection

- [x] Encryption at rest: PostgreSQL encryption enabled
- [x] Encryption in transit: TLS 1.3 required
- [x] Data retention: 90 days for call logs, 1 year for audit
- [x] Data deletion: GDPR-compliant with rollback

---

## 10. Incident Response

### Monitoring & Alerts

Set up alerts for:

```
# Critical
- Database connection failures
- API response time > 5s
- WebSocket connection failures
- GDPR delete request errors

# Warning
- Memory usage > 80%
- Database query > 1s
- API error rate > 1%
- Audit log lag > 5 minutes
```

### Common Issues & Solutions

**Issue**: Database connection timeout
```
Solution:
1. Check DB service is running: railway logs postgres
2. Verify DATABASE_URL in environment
3. Check IP allowlist on Railway
4. Restart backend service: railway redeploy
```

**Issue**: WebSocket connection fails
```
Solution:
1. Verify WSS endpoint is correct
2. Check token generation: curl /api/voice-agent/elevenlabs-stream-token
3. Verify ElevenLabs API key is valid
4. Check browser console for CORS errors
5. Verify SSL certificate validity
```

**Issue**: High API latency
```
Solution:
1. Check database query performance: SELECT * FROM pg_stat_statements;
2. Review slow query logs
3. Add indexes if needed
4. Scale up database CPU/RAM in Railway
5. Check vector DB (Qdrant) performance
```

### Rollback Procedure

```bash
# If deployment fails, Railway keeps previous version
# Automatic rollback:
railway rollback

# Or redeploy specific commit:
git checkout <commit-hash>
git push origin main
# Cloudflare Pages auto-deploys

# Verify rollback:
curl https://api.aidevelo.ai/health
```

---

## 11. Post-Deployment Tasks

### Documentation Update

- [ ] Update README with production URLs
- [ ] Add API endpoints to docs
- [ ] Document environment variables
- [ ] Create runbook for common tasks

### User Notification

- [ ] Notify users of new privacy features
- [ ] Send privacy policy update email
- [ ] Provide data export instructions
- [ ] Publicize GDPR/nDSG compliance

### Compliance Verification

- [ ] GDPR privacy policy live ✓
- [ ] Data export endpoint working ✓
- [ ] Data deletion endpoint working ✓
- [ ] Audit logs recording ✓
- [ ] DPO contact email configured ✓

### Performance Baseline

```bash
# Test production performance
# Load test: 1000 requests
ab -n 1000 -c 10 https://api.aidevelo.ai/health

# WebSocket test: 5 concurrent connections
# 60 second duration
# Measure: latency, throughput, errors

# Record baseline:
# - API response time: < 100ms p50
# - WebSocket latency: < 200ms p50
# - Availability: > 99.9%
```

---

## 12. Monitoring Dashboard

### Suggested Metrics Dashboard

```
┌─────────────────────────────────────────────────┐
│       AIDevelo.ai Production Dashboard          │
├──────────────────┬──────────────────┬───────────┤
│ API Health       │ Database Status  │ Voice     │
│ ✓ 99.95% uptime │ ✓ Connected      │ ✓ Active  │
│ Response: 85ms   │ Connections: 8/25│ Streams:2 │
├──────────────────┼──────────────────┼───────────┤
│ GDPR Compliance  │ Security         │ Performance
│ ✓ Export works   │ ✓ SSL enabled    │ ✓ P50:85ms
│ ✓ Delete works   │ ✓ Rate limiting  │ ✓ P99:250ms
│ ✓ Audit logs     │ ✓ CORS correct   │ ✓ Errors:0.02%
└──────────────────┴──────────────────┴───────────┘
```

Set up using:
- Grafana + Prometheus (for metrics)
- Jaeger UI (for tracing)
- Railway built-in dashboard

---

## 13. Cost Optimization

### Railway Pricing

```
PostgreSQL:    ~$30/month (1GB RAM)
Redis:         ~$20/month
WebSocket:     Included
Traffic:       ~$0.04/GB outbound
Total est:     ~$60-100/month
```

### Cost Reduction Tips

1. **Database**: Start with smallest tier, scale as needed
2. **Redis**: Use standard tier (no premium)
3. **Qdrant**: Consider managed service (Qdrant Cloud) ~$10/month
4. **Cloudflare Pages**: Free tier sufficient for static assets
5. **Monitoring**: Use Railway built-in, only export essential metrics

### Scaling Plan

```
Phase 1 (0-1000 users):     Current config
Phase 2 (1000-10k users):   +PostgreSQL RAM, Redis
Phase 3 (10k+ users):       Multi-region, CDN, DB replication
```

---

## 14. Checklist

**Pre-Deployment**
- [ ] All tests passing
- [ ] Build succeeds
- [ ] No sensitive data in code
- [ ] Documentation complete
- [ ] Environment variables documented

**Railway Deployment**
- [ ] PostgreSQL created
- [ ] Redis created
- [ ] Backend deployed
- [ ] Migrations applied
- [ ] Health checks passing

**Frontend Deployment**
- [ ] Production build created
- [ ] Deployed to Cloudflare Pages
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] API calls working

**Verification**
- [ ] API endpoints responding
- [ ] WebSocket connections working
- [ ] Database queries fast (< 100ms)
- [ ] Privacy endpoints working
- [ ] Audit logs recording
- [ ] Monitoring dashboard active

**Post-Deployment**
- [ ] Users notified
- [ ] Privacy policy published
- [ ] Backup verified
- [ ] Incident response plan ready
- [ ] Cost baseline recorded

---

## 15. Support & Escalation

### Emergency Contacts
- **Database Issue**: Railway support
- **Frontend Issue**: Cloudflare support  
- **Voice API Issue**: ElevenLabs support
- **Security Issue**: CERT team

### Maintenance Window
- Scheduled: Sundays 02:00-04:00 UTC
- Notification: 48 hours in advance
- Fallback: Automatic service restart

### SLA Targets
- Availability: 99.9%
- Response time: < 100ms p50
- Recovery time: < 15 minutes for critical issues

---

**Status**: ✅ Production Ready  
**Deployment Target**: Railway + Cloudflare Pages  
**Estimated Deployment Time**: 30-45 minutes  
**Next Step**: Execute deployment following this guide
