# GitHub Actions Docker Setup - Complete Guide

## 📋 Overview

Your GitHub Actions workflows provide comprehensive Docker CI/CD automation including:

- **Continuous Integration**: Build, test, and scan on every push/PR
- **Security Scanning**: Multiple security tools for vulnerability detection
- **Image Publishing**: Automated publishing to GHCR and Docker Hub
- **Cleanup & Maintenance**: Automated cache and registry cleanup
- **Monitoring**: Container health checks and performance testing

## 🚀 New Workflows Added

### 1. Container Security Audit (`container-security.yml`)

**Purpose**: Comprehensive security scanning for Docker images

**Features**:
- Dockerfile best practices with hadolint
- Vulnerability scanning with Trivy and Grype
- Secret detection with Gitleaks
- Compliance checking with Dockle
- SBOM generation with Syft
- Docker Bench Security

**Triggers**:
- Daily at 1 AM UTC
- On Dockerfile changes
- Manual dispatch

**Usage**:
```bash
# Manual trigger
gh workflow run container-security.yml
```

### 2. Docker Registry Cleanup (`docker-cleanup.yml`)

**Purpose**: Manage container registry storage and remove old images

**Features**:
- Remove untagged images
- Keep only recent versions (default: 10)
- Clean up closed PR images
- Protected tags (latest, main, develop, semantic versions)

**Triggers**:
- Weekly on Sunday at 3 AM UTC
- Manual dispatch with custom keep count

**Usage**:
```bash
# Keep 20 recent versions instead of default 10
gh workflow run docker-cleanup.yml -f keep_count=20
```

### 3. Docker Build Cache Management (`docker-build-cache.yml`)

**Purpose**: Optimize GitHub Actions cache usage

**Features**:
- Weekly cache cleanup
- Cache usage statistics
- Prevents cache bloat (10GB limit)

**Triggers**:
- Weekly on Sunday
- Manual dispatch

## 📁 New Files Created

### Production Files

1. **`Dockerfile.optimized`**
   - Enhanced multi-stage build
   - Non-root user execution
   - Better layer caching
   - Security hardening
   - Reduced image size

2. **`docker-compose.prod.yml`**
   - Production-ready configuration
   - Resource limits and reservations
   - Health checks for all services
   - Nginx reverse proxy with SSL
   - Prometheus + Grafana monitoring
   - Read-only root filesystem
   - Security capabilities

3. **`infra/nginx/nginx.conf`**
   - Reverse proxy configuration
   - SSL/TLS termination
   - Rate limiting
   - Caching strategy
   - WebSocket support
   - Security headers

### Workflow Files

4. **`.github/workflows/container-security.yml`**
5. **`.github/workflows/docker-cleanup.yml`**
6. **`.github/workflows/docker-build-cache.yml`**

## 🔧 Setup Instructions

### 1. Replace Current Dockerfile (Optional)

If you want to use the optimized Dockerfile:

```bash
# Backup current Dockerfile
cp Dockerfile Dockerfile.backup

# Use optimized version
cp Dockerfile.optimized Dockerfile

# Test locally
docker build -t aidevelo:test .
docker run -d -p 5000:5000 aidevelo:test
```

### 2. Configure GitHub Secrets

Required secrets for full functionality:

```bash
# Docker Hub (optional)
DOCKERHUB_USERNAME=your_username
DOCKERHUB_TOKEN=your_token

# Deployment
RAILWAY_TOKEN=your_railway_token
CLOUDFLARE_API_TOKEN=your_cf_token

# Production monitoring
GRAFANA_ADMIN_PASSWORD=secure_password
```

### 3. Configure GitHub Variables

```bash
# Enable backend deployment
DEPLOY_BACKEND=true

# Production API URL
API_URL=https://api.aidevelo.ai
```

### 4. Enable Workflow Permissions

In your repository settings:

1. Go to **Settings → Actions → General**
2. Under "Workflow permissions", select:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

### 5. Set Up Production Environment

```bash
# Copy production compose file
cp docker-compose.prod.yml docker-compose.override.yml

# Create SSL directory
mkdir -p infra/nginx/ssl

# Generate self-signed cert for testing (replace with Let's Encrypt in production)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infra/nginx/ssl/privkey.pem \
  -out infra/nginx/ssl/fullchain.pem
```

## 🎯 Workflow Usage

### Running Workflows Manually

```bash
# Security scan
gh workflow run container-security.yml

# Registry cleanup (keep 15 versions)
gh workflow run docker-cleanup.yml -f keep_count=15

# Cache cleanup
gh workflow run docker-build-cache.yml

# Publish specific tag
gh workflow run docker-publish.yml -f tag=v1.2.3
```

### Monitoring Workflows

```bash
# List all workflow runs
gh run list

# Watch specific workflow
gh run watch

# View workflow details
gh run view <run-id>
```

## 🐳 Docker Best Practices Implemented

### 1. Multi-Stage Builds
- Separate stages for dependencies, build, and production
- Minimal final image size
- Better layer caching

### 2. Security
- ✅ Non-root user execution
- ✅ Read-only root filesystem
- ✅ Dropped capabilities
- ✅ Security scanning (Trivy, Grype)
- ✅ Secret detection
- ✅ SBOM generation

### 3. Performance
- ✅ Layer caching optimization
- ✅ Parallel builds
- ✅ Build cache persistence
- ✅ Resource limits

### 4. Production Readiness
- ✅ Health checks
- ✅ Graceful shutdown (tini)
- ✅ Logging configuration
- ✅ Monitoring setup
- ✅ SSL/TLS support

## 📊 Image Size Comparison

Expected improvements with optimized Dockerfile:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Image Size | ~800MB | ~400MB | 50% reduction |
| Build Time | 8-10 min | 4-6 min | 40% faster |
| Layers | 25-30 | 15-20 | Simplified |
| Vulnerabilities | Medium | Low | Better security |

## 🔍 Security Scanning Results

After running `container-security.yml`, check:

1. **Security Tab**: `github.com/<org>/<repo>/security`
   - View Trivy and Grype findings
   - Check dependency vulnerabilities
   - Review code scanning alerts

2. **Workflow Summary**:
   - Hadolint findings
   - Dockle compliance issues
   - Docker Bench recommendations

3. **Artifacts**:
   - Download SBOM (sbom.spdx.json)
   - Review scan reports

## 🚀 Deployment Workflow

### Staging Deployment

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/new-feature

# Workflows run automatically:
# ✅ Dockerfile lint
# ✅ Build and test
# ✅ Security scan
# ✅ Integration tests
```

### Production Deployment

```bash
# 1. Merge PR to main
# Workflows run automatically:
# ✅ All CI checks
# ✅ Push to GHCR
# ✅ Deploy backend (if enabled)

# 2. Create release for versioned deployment
git tag v1.0.0
git push origin v1.0.0

# Release workflow runs:
# ✅ Multi-platform build
# ✅ Push to GHCR and Docker Hub
# ✅ Sign images
# ✅ Generate SBOM
# ✅ Create deployment manifest
```

## 📈 Monitoring and Observability

### Using Prometheus + Grafana

```bash
# Start monitoring stack
docker-compose -f docker-compose.prod.yml up -d prometheus grafana

# Access Grafana
open http://localhost:3001
# Default credentials: admin / admin

# Import dashboards:
# - Docker container metrics
# - Node.js application metrics
# - PostgreSQL metrics
# - Redis metrics
```

### Key Metrics to Monitor

1. **Container Health**:
   - CPU usage
   - Memory consumption
   - Disk I/O
   - Network traffic

2. **Application Metrics**:
   - Request rate
   - Response time
   - Error rate
   - Active connections

3. **Infrastructure**:
   - Database connections
   - Cache hit rate
   - Queue length
   - Storage usage

## 🛠️ Troubleshooting

### Build Failures

```bash
# Check build logs
gh run view --log

# Test locally
docker build -t test .

# Debug specific stage
docker build --target frontend-builder -t debug .
docker run -it debug sh
```

### Security Scan Failures

```bash
# Run Trivy locally
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image aidevelo:latest

# Fix vulnerabilities
# 1. Update base image
# 2. Update dependencies
# 3. Rebuild and rescan
```

### Registry Issues

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull image
docker pull ghcr.io/<org>/aidevelo:latest

# Check image exists
gh api /user/packages/container/aidevelo/versions
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Container Security Guide](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Prometheus Monitoring](https://prometheus.io/docs/introduction/overview/)

## 🎉 Next Steps

1. ✅ Review and test new workflows
2. ✅ Set up required secrets and variables
3. ✅ Test Dockerfile.optimized locally
4. ✅ Enable security scanning in Security tab
5. ✅ Set up monitoring with Prometheus/Grafana
6. ✅ Configure SSL certificates for production
7. ✅ Document custom deployment procedures

---

**Questions or Issues?** Check the workflow logs or create an issue in the repository.
