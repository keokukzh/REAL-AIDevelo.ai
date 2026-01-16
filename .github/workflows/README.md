# Docker CI/CD Configuration

This directory contains GitHub Actions workflows for building, testing, and deploying Docker containers.

## Workflows

### 🐳 docker-ci.yml
Main Docker CI/CD pipeline with:
- **Dockerfile linting** with hadolint
- **Multi-platform builds** (amd64, arm64)
- **Security scanning** with Trivy
- **Automated testing** of built images
- **Layer analysis** and size optimization
- **GitHub Container Registry** publishing

**Triggers:** Push to main/develop, Pull requests

### 📦 docker-publish.yml
Container registry publishing with:
- **Multi-registry support** (GHCR + Docker Hub)
- **Multi-platform images**
- **Image signing** with Cosign
- **SBOM generation**
- **Automated service image publishing**

**Triggers:** Release published, Manual workflow dispatch

### 🧪 integration-tests.yml
Full stack integration testing with:
- **Docker Compose orchestration**
- **Database migrations**
- **E2E testing** with Playwright
- **Performance testing**
- **Service health validation**

**Triggers:** Push, Pull requests, Daily schedule (2 AM UTC)

### ✅ ci.yml
Standard CI pipeline for:
- **Frontend build and test**
- **Backend build and test** (Node 20, 22)
- **E2E tests**
- **Railway deployment**

**Triggers:** Push to main, Pull requests

### 🔍 test-automation.yml
Automated testing suite:
- **Unit tests with coverage**
- **Site audits** (local and production)
- **Scheduled testing**

**Triggers:** Push, Pull requests, Daily schedule (3 AM UTC)

### ☁️ cloudflare-pages.yml
Frontend deployment to Cloudflare Pages

**Triggers:** Push to main

## Docker Best Practices Implemented

### 1. Multi-stage Builds
- Separate build stages for frontend and backend
- Minimal production image with only runtime dependencies
- Reduced final image size

### 2. Layer Caching
- GitHub Actions cache for faster builds
- Optimal layer ordering for cache hits
- Build cache sharing between workflows

### 3. Security
- **Trivy scanning** for vulnerabilities
- **Non-root user** in containers
- **Image signing** with Cosign
- **SBOM generation** for compliance

### 4. Health Checks
- Container health checks in Dockerfile
- Service health validation in tests
- Automated health endpoint testing

## Required Secrets

Configure these in GitHub Settings → Secrets:

### For Docker Hub Publishing (Optional)
```
DOCKERHUB_USERNAME - Your Docker Hub username
DOCKERHUB_TOKEN - Docker Hub access token
```

### For Deployment
```
RAILWAY_TOKEN - Railway deployment token (if using Railway)
CLOUDFLARE_API_TOKEN - Cloudflare API token
CLOUDFLARE_ACCOUNT_ID - Cloudflare account ID
```

## Environment Variables

Configure these in GitHub Settings → Variables:

```
DEPLOY_BACKEND=true - Enable backend deployment
API_URL - Production API URL for health checks
```

## Image Tagging Strategy

Images are tagged with:
- `latest` - Latest main branch build
- `{version}` - Semantic version from releases
- `{major}.{minor}` - Major.minor version
- `{branch}-{sha}` - Branch name + commit SHA
- `pr-{number}` - Pull request builds

## Multi-platform Support

Images are built for:
- `linux/amd64` - Standard x86_64 servers
- `linux/arm64` - ARM servers (AWS Graviton, Apple Silicon)

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Test Docker CI workflow
act push -W .github/workflows/docker-ci.yml

# Test with specific event
act pull_request -W .github/workflows/docker-ci.yml
```

## Monitoring Build Performance

- **Build times** are tracked in GitHub Actions
- **Image sizes** are reported in workflow summaries
- **Layer analysis** available in artifacts
- **Cache hit rates** visible in build logs

## Optimizing Docker Builds

### Current Optimizations:
1. ✅ Multi-stage builds
2. ✅ Layer caching with GitHub Actions
3. ✅ .dockerignore for faster context
4. ✅ npm ci instead of npm install
5. ✅ Production dependencies only in final stage

### Further Optimization Ideas:
- Use Alpine-based images where possible
- Implement distroless images for security
- Add build ARGs for customization
- Use BuildKit features for parallel builds

## Troubleshooting

### Build Failures
1. Check hadolint warnings in workflow logs
2. Verify .dockerignore excludes unnecessary files
3. Ensure all ARGs and ENVs are properly defined

### Test Failures
1. Check service health in integration tests
2. Verify environment variables are set correctly
3. Review container logs in artifacts

### Security Scan Failures
1. Review Trivy results in Security tab
2. Update base images to patch vulnerabilities
3. Update npm dependencies

## Next Steps

Consider adding:
- [ ] Kubernetes manifests for deployment
- [ ] Helm charts for easier deployment
- [ ] Docker Compose override files for different environments
- [ ] Additional security scanning (Snyk, Grype)
- [ ] Performance benchmarking
- [ ] Automated rollback on failed health checks
