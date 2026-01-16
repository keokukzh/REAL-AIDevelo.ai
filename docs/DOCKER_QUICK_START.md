# Docker GitHub Actions - Quick Reference

## 🚀 Quick Commands

### Manual Workflow Triggers
```bash
# Security scan
gh workflow run container-security.yml

# Registry cleanup
gh workflow run docker-cleanup.yml -f keep_count=15

# Cache management
gh workflow run docker-build-cache.yml

# Publish release
gh workflow run docker-publish.yml -f tag=v1.2.3
```

### Local Docker Commands
```bash
# Build optimized image
docker build -f Dockerfile.optimized -t aidevelo:opt .

# Test container
docker run -d -p 5000:5000 --name test aidevelo:opt

# Check logs
docker logs -f test

# Execute into container
docker exec -it test sh

# Stop and remove
docker stop test && docker rm test
```

### Docker Compose Commands
```bash
# Development
docker compose up -d
docker compose logs -f aidevelo

# Production
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps

# Testing
docker compose -f docker-compose.test.yml up --abort-on-container-exit
docker compose -f docker-compose.test.yml down -v
```

## 📊 Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push, PR | Standard CI pipeline |
| `docker-ci.yml` | Push (main/develop), PR | Docker build & test |
| `docker-publish.yml` | Release, Manual | Publish to registries |
| `integration-tests.yml` | Push, PR, Daily | Full stack testing |
| `container-security.yml` | Daily, Dockerfile changes | Security scanning |
| `docker-cleanup.yml` | Weekly, Manual | Registry cleanup |
| `docker-build-cache.yml` | Weekly, Manual | Cache management |

## 🔐 Security Scanning

### Trivy (Local)
```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image aidevelo:latest
```

### Hadolint (Dockerfile Linting)
```bash
docker run --rm -i hadolint/hadolint < Dockerfile
```

### Dockle (Image Linting)
```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  goodwithtech/dockle aidevelo:latest
```

## 🏷️ Image Tags

| Tag Pattern | When Created | Example |
|-------------|--------------|---------|
| `latest` | Main branch push | `ghcr.io/org/aidevelo:latest` |
| `main` | Main branch push | `ghcr.io/org/aidevelo:main` |
| `develop` | Develop branch | `ghcr.io/org/aidevelo:develop` |
| `pr-123` | Pull request | `ghcr.io/org/aidevelo:pr-123` |
| `v1.2.3` | Release tag | `ghcr.io/org/aidevelo:v1.2.3` |
| `sha-abc123` | Every commit | `ghcr.io/org/aidevelo:main-sha-abc123` |

## 📦 Image Registry

### Pull Images
```bash
# From GHCR
docker pull ghcr.io/<org>/aidevelo:latest

# From Docker Hub (if configured)
docker pull aidevelo/aidevelo:latest
```

### Push Images
```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag image
docker tag aidevelo:local ghcr.io/<org>/aidevelo:custom

# Push
docker push ghcr.io/<org>/aidevelo:custom
```

## 🔍 Debugging

### Check Workflow Status
```bash
# List recent runs
gh run list --workflow=docker-ci.yml

# Watch specific run
gh run watch

# View logs
gh run view --log
```

### Inspect Images
```bash
# List layers
docker history aidevelo:latest

# Inspect configuration
docker inspect aidevelo:latest

# Check size
docker images aidevelo:latest

# Dive into layers
docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive:latest aidevelo:latest
```

### Container Health
```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' container_name

# View health check logs
docker inspect --format='{{json .State.Health}}' container_name | jq

# Test health endpoint
curl http://localhost:5000/health
```

## 🎯 Performance

### Build Optimization
```bash
# Use BuildKit
DOCKER_BUILDKIT=1 docker build -t aidevelo .

# No cache build
docker build --no-cache -t aidevelo .

# Parallel builds
docker build --build-arg BUILDKIT_INLINE_CACHE=1 -t aidevelo .

# Multi-platform
docker buildx build --platform linux/amd64,linux/arm64 -t aidevelo .
```

### Cache Management
```bash
# View cache
docker buildx du

# Clean build cache
docker buildx prune

# Remove all unused data
docker system prune -a --volumes
```

## 📈 Monitoring

### Container Stats
```bash
# Real-time stats
docker stats

# Specific container
docker stats aidevelo-app

# Export to JSON
docker stats --no-stream --format "{{json .}}"
```

### Logs
```bash
# Follow logs
docker logs -f aidevelo-app

# Last 100 lines
docker logs --tail 100 aidevelo-app

# Since timestamp
docker logs --since 1h aidevelo-app

# Export logs
docker logs aidevelo-app > app.log 2>&1
```

### Prometheus Queries
```promql
# Container CPU usage
rate(container_cpu_usage_seconds_total{name="aidevelo-app"}[5m])

# Memory usage
container_memory_usage_bytes{name="aidevelo-app"}

# Network I/O
rate(container_network_receive_bytes_total{name="aidevelo-app"}[5m])
```

## 🛠️ Common Issues

### Build Fails
```bash
# Clean everything
docker system prune -a --volumes

# Rebuild without cache
docker build --no-cache -f Dockerfile.optimized .

# Check BuildKit
export DOCKER_BUILDKIT=1
```

### Container Won't Start
```bash
# Check logs
docker logs container_name

# Inspect exit code
docker inspect container_name --format='{{.State.ExitCode}}'

# Run with shell
docker run -it --entrypoint sh aidevelo:latest
```

### Permission Issues
```bash
# Check user inside container
docker exec container_name whoami

# Fix permissions
docker exec -u root container_name chown -R nodejs:nodejs /app
```

### Network Issues
```bash
# Inspect network
docker network inspect bridge

# Test connectivity
docker exec container_name ping other_container

# Check DNS
docker exec container_name nslookup google.com
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Current production build |
| `Dockerfile.optimized` | Enhanced version with optimizations |
| `docker-compose.yml` | Development stack |
| `docker-compose.prod.yml` | Production configuration |
| `docker-compose.test.yml` | Testing environment |
| `.dockerignore` | Files to exclude from build |
| `.dive-ci` | Image analysis thresholds |

## 📝 Environment Variables

### Required
- `NODE_ENV`: production/development/test
- `PORT`: Application port (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string

### Optional
- `REDIS_URL`: Redis connection
- `MINIO_ENDPOINT`: S3-compatible storage
- `QDRANT_URL`: Vector database
- `SENTRY_DSN`: Error tracking

## 🎓 Resources

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

---

**Pro Tip**: Use `make` commands if Makefile exists:
```bash
make build
make test
make deploy
```
