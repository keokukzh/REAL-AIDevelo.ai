# Production Deployment Quick Reference

Quick reference guide for deploying AIDevelo.ai to production.

## 🚀 Quick Deploy

### Method 1: Automated (Recommended)
```bash
# Trigger via GitHub Actions
# Go to: Actions → "Production Release" → Run workflow
# Input: version (e.g., v1.0.0)
```

### Method 2: Manual Script
```bash
# Run the deployment script
npm run deploy:production

# Or with options
bash scripts/deploy-production.sh --skip-tests
bash scripts/deploy-production.sh --frontend-only
bash scripts/deploy-production.sh --backend-only
```

### Method 3: Git Push (Auto-Deploy)
```bash
# Push to main branch triggers auto-deployment
git push origin main
```

## 📋 Pre-Deploy Checklist

Use this quick checklist before any production deployment:

- [ ] All tests pass (`npm run test:unit` + `cd server && npm run test:unit`)
- [ ] Linting passes (`npm run lint` + `cd server && npm run lint`)
- [ ] Build succeeds (`npm run build` + `cd server && npm run build`)
- [ ] No security vulnerabilities (`npm audit` + `cd server && npm audit`)
- [ ] No uncommitted changes (`git status`)
- [ ] On main branch or PR approved
- [ ] Team notified of deployment

📖 **Full checklist**: [PRE_MERGE_CHECKLIST.md](./PRE_MERGE_CHECKLIST.md)

## 🔍 Post-Deploy Verification

```bash
# Check frontend
curl https://aidevelo.ai

# Check backend health
curl https://real-aidevelo-ai.onrender.com/api/health

# Run smoke tests
npm run audit:prod
```

## 🔄 Rollback

If issues are detected:

### Quick Rollback
```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>
git push origin main
```

### Via Dashboard
- **Cloudflare**: Workers & Pages → Deployments → Rollback
- **Render**: Service → Manual Deploy → Select previous deployment

📖 **Full rollback guide**: [MERGE_TO_MAIN_AND_DEPLOY.md#rollback-procedure](./MERGE_TO_MAIN_AND_DEPLOY.md#rollback-procedure)

## 📊 Monitoring

After deployment, monitor:

1. **Health Checks**
   - Frontend: https://aidevelo.ai
   - Backend: https://real-aidevelo-ai.onrender.com/api/health

2. **Logs**
   - Cloudflare: https://dash.cloudflare.com/
   - Render: https://dashboard.render.com/

3. **Errors**
   - Check Sentry (if configured)
   - Monitor application logs

## 🔧 Troubleshooting

### Build Fails
```bash
# Check Node version
node -v  # Should be 20.x

# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Succeeds but Changes Not Visible
```bash
# Clear Cloudflare cache
# Dashboard → Caching → Purge Everything
```

### Health Check Fails
```bash
# Check backend logs in Render dashboard
# Verify environment variables are set
# Check database connection
```

📖 **Full troubleshooting**: [MERGE_TO_MAIN_AND_DEPLOY.md#troubleshooting](./MERGE_TO_MAIN_AND_DEPLOY.md#troubleshooting)

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [MERGE_TO_MAIN_AND_DEPLOY.md](./MERGE_TO_MAIN_AND_DEPLOY.md) | Complete deployment guide |
| [PRE_MERGE_CHECKLIST.md](./PRE_MERGE_CHECKLIST.md) | Detailed pre-merge checklist |
| [DEPLOY.md](./DEPLOY.md) | Platform-specific deployment instructions |
| [PRODUCTION_ENV_VARS.md](./PRODUCTION_ENV_VARS.md) | Production environment variables |
| [troubleshooting.md](./troubleshooting.md) | Common issues and solutions |

## 🎯 Common Commands

```bash
# Development
npm run dev                      # Start frontend
cd server && npm run dev         # Start backend

# Testing
npm run test:unit               # Frontend tests
cd server && npm run test:unit  # Backend tests
npm run test:e2e                # E2E tests

# Building
npm run build                   # Build frontend
cd server && npm run build      # Build backend

# Deployment
npm run deploy:production       # Deploy via script
npm run deploy:cf               # Deploy frontend only
git push origin main            # Trigger auto-deploy

# Verification
npm run audit:prod              # Production smoke tests
```

## 🚨 Emergency Procedures

### Immediate Rollback Required
1. Identify the problematic merge commit hash
2. Revert: `git revert -m 1 <commit-hash>`
3. Push: `git push origin main`
4. Verify rollback completed
5. Investigate issue in separate branch

### Production Down
1. Check status pages (Cloudflare, Render)
2. Review recent deployments
3. Check logs for errors
4. Execute rollback if needed
5. Communicate with team and users

## 📞 Support

- **GitHub Issues**: https://github.com/keokukzh/REAL-AIDevelo.ai/issues
- **Documentation**: `/docs` directory
- **Team Communication**: Slack/Discord (as configured)

---

**Last Updated**: 2024-02-04  
**Version**: 1.0.0
