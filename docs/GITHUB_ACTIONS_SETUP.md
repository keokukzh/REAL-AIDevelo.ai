# GitHub Actions Setup Guide

Complete guide for setting up CI/CD with Docker for AIDevelo.ai

## 📋 Table of Contents

1. [Initial Setup](#initial-setup)
2. [Required Secrets](#required-secrets)
3. [Workflow Configuration](#workflow-configuration)
4. [Docker Registry Setup](#docker-registry-setup)
5. [Testing the Setup](#testing-the-setup)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)

## 🚀 Initial Setup

### 1. Enable GitHub Actions

GitHub Actions is enabled by default for public repositories. For private repositories:

1. Go to repository **Settings** → **Actions** → **General**
2. Under "Actions permissions", select "Allow all actions and reusable workflows"
3. Under "Workflow permissions", select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"

### 2. Enable GitHub Container Registry

GHCR is enabled by default, but you may need to configure package visibility:

1. Go to **Settings** → **Packages**
2. For each package, set visibility (Public/Private)
3. Link packages to repository

### 3. Configure Branch Protection

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks to pass:
     - `Frontend Build and Test`
     - `Backend Build and Test`
     - `E2E Tests`
     - `Build and Test Docker Images`

## 🔐 Required Secrets

### GitHub Secrets Setup

Navigate to **Settings** → **Secrets and variables** → **Actions**

#### For Docker Hub (Optional)

If you want to publish to Docker Hub in addition to GHCR:

```
Secret Name: DOCKERHUB_USERNAME
Value: <your-docker-hub-username>

Secret Name: DOCKERHUB_TOKEN  
Value: <your-docker-hub-access-token>
```

Get Docker Hub token:
1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name it "GitHub Actions"
4. Copy the token

#### For Railway Deployment (Optional)

If deploying backend to Railway:

```
Secret Name: RAILWAY_TOKEN
Value: <your-railway-token>
```

Get Railway token:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and get token
railway login
railway whoami --token
```

#### For Cloudflare Pages (Optional)

If deploying frontend to Cloudflare Pages:

```
Secret Name: CLOUDFLARE_API_TOKEN
Value: <your-cloudflare-api-token>

Secret Name: CLOUDFLARE_ACCOUNT_ID
Value: <your-cloudflare-account-id>
```

Get Cloudflare credentials:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create token with "Cloudflare Pages" template
3. Find Account ID in Cloudflare dashboard URL

### Environment Variables

Navigate to **Settings** → **Secrets and variables** → **Actions** → **Variables**

```
Variable Name: DEPLOY_BACKEND
Value: true (or false to disable auto-deployment)

Variable Name: API_URL
Value: https://your-production-api.com (for health checks)
```

## ⚙️ Workflow Configuration

### Workflows Included

Your repository now has 5 main workflows:

#### 1. **docker-ci.yml** - Main Docker Pipeline
- **Triggers:** Push to main/develop, Pull requests
- **Jobs:**
  - Lint Dockerfile with hadolint
  - Build Docker images with caching
  - Run security scans with Trivy
  - Test built images
  - Analyze image size
  - Push to GHCR (on main branch)

#### 2. **docker-publish.yml** - Registry Publishing
- **Triggers:** Release published, Manual dispatch
- **Jobs:**
  - Build multi-platform images (amd64, arm64)
  - Push to GHCR and Docker Hub
  - Sign images with Cosign
  - Generate SBOM
  - Create deployment manifests

#### 3. **integration-tests.yml** - Full Stack Testing
- **Triggers:** Push, Pull requests, Daily at 2 AM UTC
- **Jobs:**
  - Start Docker Compose stack
  - Run database migrations
  - Execute integration tests
  - Run E2E tests with Playwright
  - Performance testing

#### 4. **ci.yml** - Standard CI
- **Triggers:** Push to main, Pull requests
- **Jobs:**
  - Frontend build and test
  - Backend build and test (Node 20, 22)
  - E2E tests
  - Deploy to Railway

#### 5. **test-automation.yml** - Test Suite
- **Triggers:** Push, Pull requests, Daily at 3 AM UTC
- **Jobs:**
  - Unit tests with coverage
  - Site audits (local and production)

## 🐳 Docker Registry Setup

### GitHub Container Registry (GHCR)

No additional setup required! Workflows automatically push to:
```
ghcr.io/<your-username>/<repository-name>:latest
```

### Docker Hub (Optional)

If configured, images are pushed to:
```
<dockerhub-username>/aidevelo:latest
```

### Using Published Images

Pull and run:
```bash
# From GHCR
docker pull ghcr.io/<username>/real-aidevelo-ai:latest
docker run -p 5000:5000 ghcr.io/<username>/real-aidevelo-ai:latest

# From Docker Hub (if configured)
docker pull <dockerhub-username>/aidevelo:latest
docker run -p 5000:5000 <dockerhub-username>/aidevelo:latest
```

## 🧪 Testing the Setup

### 1. Test Workflow Execution

Create a test branch:
```bash
git checkout -b test/ci-setup
git commit --allow-empty -m "test: trigger CI workflows"
git push origin test/ci-setup
```

Create a pull request and verify:
- ✅ All workflows start automatically
- ✅ Docker builds complete successfully
- ✅ Security scans pass
- ✅ Tests execute

### 2. Verify Docker Build Locally

```bash
# Test the exact workflow build
docker build -t aidevelo:test .

# Run the container
docker run -d -p 5000:5000 --name aidevelo-test aidevelo:test

# Check health
curl http://localhost:5000/health

# View logs
docker logs aidevelo-test

# Cleanup
docker stop aidevelo-test
docker rm aidevelo-test
```

### 3. Test Docker Compose Stack

```bash
# Start test environment
docker compose -f docker-compose.test.yml up -d

# Wait for services
sleep 15

# Check service health
docker compose -f docker-compose.test.yml ps

# Run a test
curl http://localhost:5001/health

# Cleanup
docker compose -f docker-compose.test.yml down -v
```

## 📊 Monitoring and Maintenance

### Check Workflow Status

1. Go to **Actions** tab in repository
2. View recent workflow runs
3. Check for failed jobs
4. Review logs for errors

### Monitor Security Scans

1. Go to **Security** tab → **Code scanning**
2. Review Trivy scan results
3. Address CRITICAL and HIGH vulnerabilities
4. Update dependencies regularly

### Track Image Sizes

Workflow summaries include:
- Total image size
- Layer breakdown
- Size comparison over time

### Review Performance

- Build times tracked automatically
- Cache hit rates in logs
- Test execution times in reports

### Regular Maintenance Tasks

#### Weekly
- [ ] Review failed workflow runs
- [ ] Check security scan results
- [ ] Monitor build times

#### Monthly
- [ ] Update base Docker images
- [ ] Review and clean up old artifacts
- [ ] Update Node.js versions in matrix

#### Quarterly
- [ ] Review workflow efficiency
- [ ] Update GitHub Actions versions
- [ ] Optimize Docker layer caching

## 🔧 Troubleshooting

### Common Issues

#### Workflow Not Triggering
**Problem:** Workflow doesn't run on push
**Solution:** 
- Check workflow file syntax
- Verify branch name matches trigger
- Check Actions permissions

#### Docker Build Fails
**Problem:** Build step fails
**Solution:**
- Review hadolint warnings
- Check Dockerfile syntax
- Verify all files in build context

#### Security Scan Failures
**Problem:** Trivy finds vulnerabilities
**Solution:**
- Update base images
- Update npm dependencies
- Review and patch critical issues

#### Tests Failing in CI
**Problem:** Tests pass locally but fail in CI
**Solution:**
- Check environment variables
- Verify service dependencies
- Review timing issues (add waits)

#### Image Push Fails
**Problem:** Cannot push to registry
**Solution:**
- Verify GITHUB_TOKEN permissions
- Check package visibility settings
- Ensure workflow has write permissions

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Trivy Security Scanner](https://aquasecurity.github.io/trivy/)
- [Hadolint Documentation](https://github.com/hadolint/hadolint)

## 🆘 Getting Help

If you encounter issues:

1. Check workflow logs in Actions tab
2. Review this documentation
3. Check Docker and GitHub Actions documentation
4. Open an issue in the repository
