# Merge to Main and Production Deployment Guide

This guide provides a comprehensive walkthrough for merging changes to the `main` branch and deploying to production.

## Table of Contents

- [Pre-Merge Checklist](#pre-merge-checklist)
- [Merge to Main Process](#merge-to-main-process)
- [Production Deployment](#production-deployment)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedure](#rollback-procedure)
- [Troubleshooting](#troubleshooting)

---

## Pre-Merge Checklist

Before merging to `main`, ensure all the following checks pass:

### 1. Code Quality

- [ ] All tests pass locally
  ```bash
  # Frontend tests
  npm run test:unit
  npm run test:e2e
  
  # Backend tests
  cd server && npm run test:unit
  cd server && npm run test:integration
  ```

- [ ] Linting passes with no errors
  ```bash
  # Frontend
  npm run lint
  npm run lint:api-prefix
  
  # Backend
  cd server && npm run lint
  ```

- [ ] Build succeeds without errors
  ```bash
  # Frontend
  npm run build
  
  # Backend
  cd server && npm run build
  ```

### 2. Security

- [ ] No security vulnerabilities in dependencies
  ```bash
  npm audit
  cd server && npm audit
  ```

- [ ] Secrets are not committed to repository
  ```bash
  git diff main | grep -iE "(api[_-]?key|secret|password|token)" || echo "✅ No secrets detected"
  ```

- [ ] Environment variables are properly documented in `.env.example` files

### 3. Documentation

- [ ] README.md is up to date
- [ ] CHANGELOG is updated with new features/fixes
- [ ] API documentation reflects any endpoint changes
- [ ] Environment variable changes are documented

### 4. Code Review

- [ ] Pull request has been reviewed by at least one other developer
- [ ] All review comments have been addressed
- [ ] CI/CD pipeline passes all checks

---

## Merge to Main Process

### Option 1: Via Pull Request (Recommended)

1. **Create/Update Pull Request**
   ```bash
   # Ensure your branch is up to date
   git checkout main
   git pull origin main
   git checkout your-feature-branch
   git merge main
   git push origin your-feature-branch
   ```

2. **Open Pull Request**
   - Go to https://github.com/keokukzh/REAL-AIDevelo.ai/pulls
   - Create a new pull request from your branch to `main`
   - Fill in the PR template with:
     - Description of changes
     - Link to related issues
     - Testing performed
     - Breaking changes (if any)

3. **Wait for CI Checks**
   - GitHub Actions will automatically run:
     - Frontend build and tests
     - Backend build and tests (Node 20 & 22)
     - E2E tests
     - Docker builds (if applicable)
   - All checks must pass before merging

4. **Get Approval**
   - Request review from team members
   - Address any feedback
   - Obtain approval from required reviewers

5. **Merge**
   - Use "Squash and merge" for clean history (recommended)
   - Or "Merge commit" to preserve individual commits
   - Delete the feature branch after merging

### Option 2: Direct Merge (For Hotfixes Only)

```bash
# ⚠️ Only use for critical hotfixes!
git checkout main
git pull origin main
git merge your-hotfix-branch
git push origin main
```

---

## Production Deployment

Once merged to `main`, deployment happens automatically via CI/CD:

### Automatic Deployments

The CI/CD pipeline (`.github/workflows/ci.yml`) automatically handles deployment:

#### Frontend (Cloudflare Pages)

1. **Trigger**: Push to `main` branch
2. **Build Process**:
   - GitHub Actions builds the frontend (`npm run build`)
   - Uploads `dist` artifacts
3. **Deployment**:
   - Cloudflare Pages automatically deploys via Git integration
   - Or manually using: `npm run deploy:cf`
4. **URL**: https://aidevelo.ai (production)

#### Backend (Render)

1. **Trigger**: Push to `main` branch or manual deploy
2. **Build Process**:
   - Render detects changes via Git integration
   - Runs: `npm install && npm run build`
   - Starts: `npm start`
3. **Health Check**:
   - CI pipeline verifies `/api/health` endpoint
   - Retries up to 5 times with 10s delays
4. **URL**: https://real-aidevelo-ai.onrender.com (or configured API_URL)

### Manual Deployment Triggers

If automatic deployment fails or you need to trigger manually:

#### Cloudflare Pages
```bash
# Deploy current build
npm run deploy:cf

# Or via wrangler CLI
wrangler pages deploy dist --project-name $CF_PAGES_PROJECT_NAME
```

#### Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Or use Render API:
   ```bash
   curl -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
     -H "Authorization: Bearer $RENDER_API_KEY" \
     -H "Content-Type: application/json"
   ```

#### Railway (Alternative Backend Host)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway up --ci --detach
```

### Docker Deployment

For Docker-based deployments:

```bash
# Build and tag
docker build -t aidevelo:latest .
docker tag aidevelo:latest ghcr.io/keokukzh/real-aidevelo.ai:latest

# Push to registry
docker push ghcr.io/keokukzh/real-aidevelo.ai:latest

# Or use the Makefile
make build
make tag
make push
```

For production release with Docker:
```bash
# Trigger via GitHub workflow
# Go to Actions → "Publish to Container Registries" → Run workflow
# Or create a new release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

## Post-Deployment Verification

After deployment, verify the application is working correctly:

### 1. Health Checks

```bash
# Frontend
curl -I https://aidevelo.ai
# Should return 200 OK

# Backend API
curl https://real-aidevelo-ai.onrender.com/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Smoke Tests

Run the automated smoke tests:
```bash
npm run audit:prod
```

Or manually verify:
- [ ] Home page loads correctly
- [ ] User can log in/sign up
- [ ] Dashboard displays data
- [ ] Voice agent functionality works
- [ ] API endpoints respond correctly

### 3. Monitor Logs

#### Cloudflare Pages
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Navigate to Workers & Pages → Your Project → Logs
- Check for any errors or warnings

#### Render
- Go to [Render Dashboard](https://dashboard.render.com/)
- Select your service → Logs tab
- Monitor for errors, warnings, or performance issues

#### Application Monitoring
- Check Sentry for error reports (if configured)
- Monitor OpenTelemetry/Jaeger traces (if configured)

### 4. Performance Checks

- [ ] Page load times are acceptable (< 3s)
- [ ] API response times are normal (< 500ms)
- [ ] No increased error rates
- [ ] Database queries are performant

### 5. User Acceptance Testing

- [ ] Test critical user flows end-to-end
- [ ] Verify new features work as expected
- [ ] Check that no regressions were introduced

---

## Rollback Procedure

If issues are discovered post-deployment, follow this rollback process:

### Frontend (Cloudflare Pages)

1. **Via Cloudflare Dashboard**:
   - Go to Workers & Pages → Your Project → Deployments
   - Find the last known good deployment
   - Click "..." → "Rollback to this deployment"

2. **Via Git Revert**:
   ```bash
   # Revert the problematic commit
   git revert <commit-hash>
   git push origin main
   # Cloudflare will auto-deploy the reverted version
   ```

### Backend (Render)

1. **Via Render Dashboard**:
   - Go to your service → "Manual Deploy"
   - Select a previous successful deployment
   - Click "Deploy"

2. **Via Git Revert**:
   ```bash
   git revert <commit-hash>
   git push origin main
   # Render will auto-deploy the reverted version
   ```

### Database Rollback

⚠️ **Database rollbacks are more complex and should be avoided if possible.**

1. **Restore from Backup**:
   ```bash
   # List available backups
   make db-backup
   
   # Restore specific backup
   make db-restore BACKUP_FILE=backup_20240204_120000.sql
   ```

2. **Revert Migration**:
   ```bash
   cd server
   npm run migrate:rollback
   ```

### Docker Rollback

```bash
# Pull previous version
docker pull ghcr.io/keokukzh/real-aidevelo.ai:v1.0.0

# Re-deploy
docker compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails on CI

**Symptoms**: GitHub Actions shows build failure

**Solutions**:
- Check the error logs in GitHub Actions
- Verify dependencies are locked in `package-lock.json`
- Ensure Node version matches (v20.x)
- Try building locally with same Node version

#### 2. Deployment Succeeds but Site Shows Old Version

**Symptoms**: Changes not visible after deployment

**Solutions**:
```bash
# Clear Cloudflare cache
# In CF Dashboard: Caching → Configuration → Purge Everything

# Or via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

#### 3. API Health Check Fails

**Symptoms**: Backend deployment fails health check

**Solutions**:
- Check Render logs for startup errors
- Verify environment variables are set correctly
- Check database connection
- Increase health check timeout in CI config

#### 4. CORS Errors After Deployment

**Symptoms**: Frontend can't connect to API

**Solutions**:
- Verify `WEB_ORIGIN` environment variable on backend
- Check `VITE_API_URL` on frontend
- Ensure allowed origins include your frontend URL
- Check `server/src/app.ts` CORS configuration

#### 5. Database Migration Issues

**Symptoms**: API returns 500 errors, logs show DB errors

**Solutions**:
```bash
# Run migrations manually
cd server
npm run migrate

# Or via Docker
docker compose -f docker-compose.prod.yml exec api npm run migrate
```

#### 6. Out of Memory Errors

**Symptoms**: Build or deployment fails with OOM

**Solutions**:
- Increase Node memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`
- Check for memory leaks in code
- Optimize build process (reduce chunk sizes)
- Upgrade Render/Railway plan for more memory

### Getting Help

If you encounter issues not covered here:

1. Check existing GitHub Issues: https://github.com/keokukzh/REAL-AIDevelo.ai/issues
2. Review logs in deployment platform
3. Check `docs/troubleshooting.md` for more specific issues
4. Reach out to the team on Slack/Discord
5. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Error messages and logs
   - Environment details

---

## Useful Commands Reference

```bash
# Development
npm run dev                    # Start frontend dev server
cd server && npm run dev       # Start backend dev server
docker compose -f docker-compose.dev.yml up  # Full stack

# Testing
npm run test:unit             # Frontend unit tests
npm run test:e2e              # E2E tests
cd server && npm run test:unit  # Backend unit tests
cd server && npm run test:integration  # Integration tests

# Building
npm run build                 # Build frontend
cd server && npm run build    # Build backend

# Deployment
npm run deploy:cf             # Deploy to Cloudflare Pages
git push origin main          # Trigger auto-deployment

# Docker
make build                    # Build Docker image
make up-prod                  # Start production stack
make down                     # Stop all services
make logs                     # View logs

# Database
make db-migrate              # Run migrations
make db-backup               # Backup database
make db-restore BACKUP_FILE=backup.sql  # Restore backup

# Monitoring
make health                  # Check health
make monitor                 # Start monitoring stack
```

---

## Additional Resources

- [Deployment Guide](./DEPLOY.md) - Detailed deployment documentation
- [Architecture](./ARCHITECTURE.md) - System architecture overview
- [Environment Variables](./PRODUCTION_ENV_VARS.md) - Production env vars
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Contributing](../CONTRIBUTING.md) - Development guidelines

---

## Version History

- **v1.0.0** (2024-02-04): Initial deployment guide
