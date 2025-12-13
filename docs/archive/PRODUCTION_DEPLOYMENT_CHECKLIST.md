# Production Deployment Checklist - AIDevelo.ai

## 🚀 Pre-Deployment Verification

### Code Quality
- ✅ All 11 tests passing: `npm run test -- --run`
- ✅ Frontend build successful: `npm run build` (1,049.62 kB main bundle)
- ✅ Backend build successful: `cd server && npm run build`
- ✅ No TypeScript errors in either project
- ✅ OpenAPI documentation generated: `npm run docs:generate`
- ✅ All 9 commits on main branch verified

### Backend Verification
```bash
# Verify all environment variables are in place
echo "Required server/.env variables:"
grep -E "ELEVENLABS_API_KEY|STRIPE_SECRET_KEY|DATABASE_URL|QDRANT_URL" server/.env || echo "WARNING: Check env vars"

# Verify migrations are ready
ls -la server/db/migrations/ | grep "010_"
```

### Frontend Verification
```bash
# Verify WebSocket client ready
grep -l "useElevenLabsStreaming" src/hooks/*.ts
grep -l "VoiceAgentStreamingUI" src/components/dashboard/*.tsx
grep -l "PrivacyControls" src/components/dashboard/*.tsx
```

---

## 📋 Backend Deployment (Railway)

### Step 1: Railway Database Setup
1. **Log in to Railway**: https://railway.app
2. **Create PostgreSQL Plugin**:
   - Click "New" → Select "PostgreSQL"
   - Reference name: `postgres-aidevelo`
   - Copy connection string to clipboard

3. **Set Database Credentials**:
   ```
   DATABASE_URL=postgresql://user:password@host:port/aidevelo
   ```

### Step 2: Backend Service Configuration
1. **Create Backend Service**:
   - Connect repository: `REAL-AIDevelo.ai`
   - Root directory: `server/`
   - Build command: `npm run build`
   - Start command: `npm run start`

2. **Set Environment Variables in Railway**:
   ```bash
   PORT=5000
   NODE_ENV=production
   DATABASE_URL=<from PostgreSQL plugin>
   REDIS_URL=<Redis if using cache>
   QDRANT_URL=https://qdrant-instance.com
   ELEVENLABS_API_KEY=<your-api-key>
   STRIPE_SECRET_KEY=<your-secret-key>
   STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   OTEL_EXPORTER_OTLP_ENDPOINT=<optional-observability>
   ```

3. **Database Migration**:
   - After database connection, run migrations:
   ```bash
   npm run wait-and-migrate
   ```
   - Verify tables created:
   ```sql
   \dt  -- List all tables
   SELECT * FROM agent_call_metrics;
   ```

### Step 3: Deploy Backend
1. **Push to main branch**:
   ```bash
   git push origin main
   ```

2. **Monitor Railway deployment**:
   - Click "View Logs" in Railway dashboard
   - Check for "Server running on port 5000"
   - Verify health endpoint: `GET http://backend-url/health`

3. **Test API Endpoints**:
   ```bash
   # Test health
   curl https://your-railway-url/health
   
   # Test voice agent token endpoint
   curl -X POST https://your-railway-url/api/voice-agent/elevenlabs-stream-token \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","agentId":"agent-id","voiceId":"pNInz6obpgDQGcFmaJgB"}'
   ```

---

## 🌐 Frontend Deployment (Cloudflare Pages)

### Step 1: Connect Repository
1. **Log in to Cloudflare Pages**: https://pages.cloudflare.com
2. **Create new project**:
   - Select "Connect to Git"
   - Choose "GitHub" and authorize
   - Select repository: `REAL-AIDevelo.ai`

3. **Configure Build Settings**:
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (not `/src`)

### Step 2: Set Environment Variables
In Cloudflare Pages Settings → Environment Variables:
```
VITE_API_URL=https://your-railway-backend-url/api
VITE_DEBUG_API=false
```

### Step 3: Configure Custom Domain
1. Go to "Custom domains"
2. Add your domain (e.g., `aidevelo.ai`)
3. Update DNS records with Cloudflare nameservers
4. Enable "Always HTTPS"

### Step 4: Deploy Frontend
1. **Push to main branch**:
   ```bash
   git push origin main
   ```

2. **Monitor Cloudflare deployment**:
   - Check build logs in Pages dashboard
   - Verify build succeeds (~4.6s)
   - Check artifact size (1.20 kB HTML + 78.97 kB CSS + 1,049 kB JS)

3. **Test Frontend**:
   ```bash
   # Visit https://yourdomain.com
   # Check console for API requests
   # Test voice call button in dashboard
   # Test privacy controls modal
   ```

---

## 🔐 Security Configuration

### Backend Security
1. **HTTPS Only**:
   - Railway provides auto-HTTPS
   - Verify `Allow only HTTPS` is enabled

2. **CORS Configuration**:
   ```bash
   # In server/.env
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

3. **API Rate Limiting**:
   - Already enabled: 100 req/15min on `/api/*`
   - Verify in server logs

4. **Database Security**:
   - Use Railway's managed PostgreSQL (encrypted at rest)
   - Enable SSL connection
   - Restrict IP access if possible

### Frontend Security
1. **Content Security Policy**:
   - Cloudflare automatically applies strict CSP
   - Review in browser DevTools → Security

2. **Subresource Integrity**:
   - Cloudflare Pages auto-verifies assets
   - No additional configuration needed

3. **GDPR/nDSG Compliance**:
   - Privacy endpoints verified: `/api/privacy/export-data`, `/api/privacy/delete-data`, `/api/privacy/audit-log`
   - User consent verified: `PrivacyControls` component in dashboard

---

## 🧪 Post-Deployment Testing

### Backend Health Checks
```bash
BACKEND_URL="https://your-railway-url"

# 1. Health endpoint
curl $BACKEND_URL/health

# 2. Ready endpoint
curl $BACKEND_URL/health/ready

# 3. Metrics endpoint
curl $BACKEND_URL/metrics | head -20

# 4. WebSocket health (requires wscat)
wscat -c wss://$BACKEND_URL/api/voice-agent/elevenlabs-stream
```

### Frontend Health Checks
```bash
FRONTEND_URL="https://yourdomain.com"

# 1. Page load
curl -I $FRONTEND_URL

# 2. Assets load
curl -I $FRONTEND_URL/assets/index-*.js

# 3. Check API connectivity (open browser console)
# Dashboard should load and display agents
```

### End-to-End Voice Call Test
1. **Log in to dashboard**: https://yourdomain.com/dashboard
2. **Click "Voice Call" button**
3. **Select an agent**
4. **Click "Start Call"**
5. **Verify**:
   - Microphone permission prompt appears
   - WebSocket connects (check DevTools → Network → WS)
   - Audio visualizer activates
   - Can speak and hear responses

### Privacy Controls Test
1. **Click "Privacy" button in dashboard**
2. **Test Export Data**:
   - Click "Export Data"
   - Verify JSON file downloads
   - Check contains agent configs + metadata

3. **Test Audit Log**:
   - Click "View Audit Log"
   - Verify logs appear with timestamps
   - Check contains action, resource, IP address

4. **Test Delete (be careful!)**:
   - Click "Delete Account"
   - Check confirmation warning
   - Verify checkbox required
   - Click "Delete All Data"
   - Verify redirect to home

---

## 📊 Monitoring & Logging

### Railway Logs
1. **View in Railway Dashboard**:
   - Click backend service
   - View "Logs" tab
   - Search for errors: `level=error`

2. **Key Metrics to Monitor**:
   - Deployment health: CPU, Memory, Network
   - API latency: Check `/metrics` endpoint
   - Database connections: `SELECT count(*) FROM pg_stat_activity;`

### Cloudflare Analytics
1. **View in Pages Dashboard**:
   - Click project
   - View "Analytics" tab
   - Monitor: Page views, Requests, Cache hit ratio

2. **Real-time Logs**:
   - Tail logs: `wrangler pages deployment tail`
   - Filter by status: `?status=4xx` or `?status=5xx`

### Error Tracking
```bash
# Check Rails logs for errors
curl https://your-railway-url/logs?level=error&limit=20

# Check Cloudflare for 4xx/5xx errors
# View in Cloudflare Dashboard → Analytics
```

---

## 🚨 Rollback Plan

### If Backend Deployment Fails
1. **Revert code**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Redeploy from Railway Dashboard**:
   - Click service
   - Go to "Deployments"
   - Click previous successful deployment
   - Click "Redeploy"

### If Frontend Deployment Fails
1. **Revert code**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Cloudflare automatic rollback**:
   - Pages automatically keeps last 25 deployments
   - Go to "Deployments"
   - Click previous working deployment
   - Click "Rollback"

---

## ✅ Final Deployment Verification

### Before Going Live
- [ ] Backend deployed and health endpoint responding
- [ ] Frontend deployed and accessible
- [ ] WebSocket connections working (test in DevTools)
- [ ] Privacy endpoints responding (test export-data)
- [ ] All tests still passing
- [ ] No console errors in browser
- [ ] Voice call test successful
- [ ] Rate limiting active (test with rapid requests)
- [ ] HTTPS enforced on both services
- [ ] GDPR/nDSG compliance confirmed

### Post-Deployment (First 24 Hours)
- [ ] Monitor error logs hourly
- [ ] Check API response times
- [ ] Test voice calls with real users
- [ ] Verify no database connection issues
- [ ] Monitor Cloudflare cache performance

---

## 📞 Production Support

### Common Issues & Solutions

**Issue**: WebSocket connection fails  
**Solution**: 
- Check `ALLOWED_ORIGINS` includes frontend URL
- Verify WebSocket protocol upgrade allowed on proxy
- Test with `wss://` protocol

**Issue**: Audio playback is silent  
**Solution**:
- Check browser permissions for microphone/speaker
- Verify ElevenLabs API key is valid
- Check WebSocket message flow in DevTools

**Issue**: Database connection timeout  
**Solution**:
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is accepting connections
- Check network security groups allow Railway

**Issue**: High memory usage  
**Solution**:
- Monitor with `pm2 monit` locally
- Check for memory leaks in WebSocket handler
- Increase Railway memory allocation if needed

---

## 📝 Deployment Completion Checklist

After deployment, verify:

```bash
# 1. Backend running
curl https://your-backend-url/health > /dev/null && echo "✅ Backend OK" || echo "❌ Backend DOWN"

# 2. Frontend running
curl -I https://yourdomain.com | grep "200" && echo "✅ Frontend OK" || echo "❌ Frontend DOWN"

# 3. Database ready
psql -h <host> -U <user> -c "\dt" | grep "agent" && echo "✅ Database OK" || echo "❌ Database DOWN"

# 4. All commits on main
git log --oneline main | head -1

# 5. All tests passing
npm run test -- --run | grep "Test Files  4 passed"
```

---

## 🎉 Deployment Complete!

Your production AIDevelo.ai instance is now live:

- **Frontend**: https://yourdomain.com
- **Backend API**: https://your-railway-url/api
- **Admin Dashboard**: https://yourdomain.com/dashboard
- **API Documentation**: https://your-railway-url/docs
- **Privacy Controls**: https://yourdomain.com/dashboard (Privacy button)

Monitor regularly and watch for issues. You're production-ready! 🚀
