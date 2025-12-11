# 🚀 Quick Start Deployment Guide - AIDevelo.ai

**Status**: ✅ Production Ready  
**Date**: December 2024  
**Build**: ✅ Passing (1,049.62 kB)  
**Tests**: ✅ 11/11 Passing  
**Commits**: 11 ahead of origin

---

## 60-Second Pre-Deployment Check

```bash
# 1. Verify everything is committed
cd c:\Users\Aidevelo\Desktop\REAL-AIDevelo.ai
git status  # Should say "working tree clean"

# 2. Verify builds work
npm run build    # Should complete in <5s
npm run test -- --run  # Should show 11 passed

# 3. Verify server config
cd server
npm run build    # Should complete without errors
```

---

## Deploy Backend (Railway) - 10 minutes

1. **Go to https://railway.app**
2. **Login** with your Railway account
3. **Create new project** → Select "PostgreSQL"
4. **Copy connection string** and set as `DATABASE_URL` environment variable
5. **Connect repository**:
   - Click "New" → "GitHub Repo"
   - Select `REAL-AIDevelo.ai`
   - Set root to `server/`
6. **Set environment variables**:
   ```
   DATABASE_URL=postgresql://user:pass@host/aidevelo
   PORT=5000
   NODE_ENV=production
   ELEVENLABS_API_KEY=xxx
   STRIPE_SECRET_KEY=xxx
   ALLOWED_ORIGINS=https://yourdomain.com
   ```
7. **Run migrations**:
   ```bash
   npm run wait-and-migrate
   ```
8. **Test endpoint**:
   ```bash
   curl https://your-railway-url/health
   ```

---

## Deploy Frontend (Cloudflare Pages) - 5 minutes

1. **Go to https://pages.cloudflare.com**
2. **Login** with your Cloudflare account
3. **Create new project** → "Connect to Git" → Select `REAL-AIDevelo.ai`
4. **Build settings**:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `/`
5. **Set environment variables**:
   ```
   VITE_API_URL=https://your-railway-url/api
   VITE_DEBUG_API=false
   ```
6. **Add custom domain**: `yourdomain.com`
7. **Update DNS**: Point domain to Cloudflare nameservers
8. **Test**: Visit `https://yourdomain.com`

---

## Push Code to Trigger Deploys

```bash
git push origin main
```

Both Railway and Cloudflare will automatically deploy on push to main.

---

## Verify Deployment

### Backend Health
```bash
curl https://your-railway-url/health
# Expected: { "status": "ok", "timestamp": "..." }

curl https://your-railway-url/health/ready
# Expected: { "ready": true }
```

### Frontend Load
```bash
# Visit https://yourdomain.com
# Should load dashboard without errors
# Check browser console for any errors
```

### Voice Call Test
```bash
1. Click "Voice Call" in dashboard
2. Select an agent
3. Click "Start Call"
4. Verify microphone permission prompt
5. Speak and listen for response
```

### Privacy Controls Test
```bash
1. Click "Privacy" in dashboard
2. Click "Export Data" - should download JSON
3. Click "View Audit Log" - should show logs
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WebSocket connection fails | Check `ALLOWED_ORIGINS` matches your frontend URL |
| API returns 404 | Verify `VITE_API_URL` points to correct backend |
| Microphone not working | Check browser permissions (Settings → Privacy) |
| Database connection timeout | Verify `DATABASE_URL` is correct; test locally first |
| Build fails on Railway | Check `npm run build` succeeds locally first |

---

## Post-Deployment Monitoring

### First Hour
- Monitor Railway logs for errors
- Test voice calls work end-to-end
- Verify API response times are <100ms

### First 24 Hours
- Check database connection health
- Monitor error rates (should be <1%)
- Test privacy endpoints

### Ongoing
- Set up alerts in Railway dashboard
- Monitor Cloudflare Analytics
- Check logs for 4xx/5xx errors daily

---

## Rollback (If Needed)

### Immediate Rollback
```bash
# Revert last commit
git revert HEAD
git push origin main

# Both Railway and Cloudflare redeploy automatically
```

### Manual Rollback in Railway
1. Go to Railway dashboard
2. Click backend service
3. Go to "Deployments"
4. Click previous successful deployment
5. Click "Redeploy"

### Manual Rollback in Cloudflare
1. Go to Pages dashboard
2. Go to "Deployments"
3. Click previous successful deployment
4. Click "Rollback"

---

## Key Endpoints

### Backend
- **API Base**: `https://your-railway-url/api`
- **Health**: `https://your-railway-url/health`
- **Docs**: `https://your-railway-url/docs`
- **WebSocket**: `wss://your-railway-url/api/voice-agent/elevenlabs-stream`

### Frontend
- **Dashboard**: `https://yourdomain.com/dashboard`
- **Onboarding**: `https://yourdomain.com/onboarding`
- **Privacy**: `https://yourdomain.com/dashboard` (Privacy button)

---

## Success Criteria

✅ **Deployment is successful when:**
- [ ] Backend endpoint responds to `/health`
- [ ] Frontend loads without 404 errors
- [ ] Voice call button works (WebSocket connects)
- [ ] Privacy controls show and allow actions
- [ ] No console errors in browser DevTools
- [ ] Database migrations have run (check tables exist)
- [ ] All 11 tests still pass locally

---

## Important Notes

1. **API Key Management**:
   - Never commit API keys to git
   - Always use Railway/Cloudflare environment variables
   - Rotate keys monthly in production

2. **Database Migrations**:
   - Always run `npm run wait-and-migrate` after deploying
   - Check migration logs: `SELECT * FROM migrations;`

3. **Monitoring**:
   - Set up Sentry for error tracking (optional)
   - Monitor Railway CPU/Memory usage
   - Check Cloudflare request volume daily

4. **Scaling**:
   - Start with Railway 2GB memory (scale up if needed)
   - Use Cloudflare global CDN for frontend
   - Set up database read replicas for high traffic

---

## Support

If deployment fails:
1. Check Railway logs: Dashboard → Backend → Logs
2. Check Cloudflare logs: Dashboard → Deployments → Build logs
3. Verify environment variables are set correctly
4. Try local build/test first: `npm run build && npm run test -- --run`
5. Check git status: `git status` (should be clean)

---

**Estimated Total Time**: 15-20 minutes  
**Expected Downtime**: 0 minutes  
**Next Step**: Push code and monitor logs

```bash
git push origin main
# Then monitor both dashboards for successful deployment
```

🚀 **Happy deploying!**
