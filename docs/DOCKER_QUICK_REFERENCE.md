# Docker CI/CD Quick Reference

## 🚀 Quick Start Commands

```bash
# Build the Docker image
docker build -t aidevelo:latest .

# Run with environment variables
docker run -d -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  --name aidevelo \
  aidevelo:latest

# Start full stack with Docker Compose
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down -v
```

## 🔍 Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| docker-ci.yml | Push, PR | Build, test, scan images |
| docker-publish.yml | Release, Manual | Publish to registries |
| integration-tests.yml | Push, PR, Daily | Full stack testing |
| ci.yml | Push, PR | Standard CI/CD |
| test-automation.yml | Push, PR, Daily | Automated testing |

## 🐳 Docker Commands in Workflows

### Build Commands
```bash
# Build with BuildKit (faster)
DOCKER_BUILDKIT=1 docker build -t aidevelo .

# Build with cache from registry
docker build --cache-from ghcr.io/user/aidevelo:latest -t aidevelo .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t aidevelo .
```

### Testing Commands
```bash
# Run container for testing
docker run -d --name test-app -p 5000:5000 aidevelo:test

# Health check
curl -f http://localhost:5000/health

# View logs
docker logs test-app

# Cleanup
docker stop test-app && docker rm test-app
```

### Security Scanning
```bash
# Scan with Trivy
trivy image aidevelo:latest

# Scan and output to file
trivy image --format sarif --output trivy-results.sarif aidevelo:latest

# Scan for HIGH and CRITICAL only
trivy image --severity HIGH,CRITICAL aidevelo:latest
```

### Image Analysis
```bash
# Check image size
docker images aidevelo:latest

# View layer history
docker history aidevelo:latest

# Detailed analysis with dive
dive aidevelo:latest

# Inspect image
docker inspect aidevelo:latest
```

## 🧪 Docker Compose Commands

### Basic Operations
```bash
# Start all services
docker compose up -d

# Start specific services
docker compose up -d postgres redis

# View service status
docker compose ps

# View logs
docker compose logs -f aidevelo

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Testing Environment
```bash
# Use test compose file
docker compose -f docker-compose.test.yml up -d

# Run migrations
docker compose -f docker-compose.test.yml run --rm aidevelo npm run migrate

# Execute tests
docker compose -f docker-compose.test.yml exec aidevelo npm test

# Cleanup
docker compose -f docker-compose.test.yml down -v
```

### Service Health Checks
```bash
# Check PostgreSQL
docker compose exec postgres pg_isready -U postgres

# Check Redis
docker compose exec redis redis-cli ping

# Check MinIO
curl -f http://localhost:9000/minio/health/live

# Check Qdrant
curl -f http://localhost:6333/health
```

## 📦 Registry Operations

### Push/Pull Images
```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag image for GHCR
docker tag aidevelo:latest ghcr.io/username/aidevelo:latest

# Push to GHCR
docker push ghcr.io/username/aidevelo:latest

# Pull from GHCR
docker pull ghcr.io/username/aidevelo:latest

# Login to Docker Hub
docker login -u USERNAME

# Push to Docker Hub
docker push username/aidevelo:latest
```

### Multi-platform Publishing
```bash
# Create buildx builder
docker buildx create --use

# Build and push multi-platform
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  -t ghcr.io/username/aidevelo:latest \
  .
```

## 🔐 Security Commands

### Image Signing (Cosign)
```bash
# Sign image
cosign sign ghcr.io/username/aidevelo:latest

# Verify signature
cosign verify ghcr.io/username/aidevelo:latest
```

### SBOM Generation
```bash
# Generate SBOM with Syft
syft ghcr.io/username/aidevelo:latest -o spdx-json > sbom.spdx.json

# Generate with Docker
docker sbom aidevelo:latest
```

## 🛠️ Debugging Commands

### Container Debugging
```bash
# Get shell in running container
docker exec -it aidevelo sh

# Run one-off command
docker exec aidevelo npm run migrate

# Inspect container details
docker inspect aidevelo

# View container resource usage
docker stats aidevelo

# View container processes
docker top aidevelo
```

### Network Debugging
```bash
# List networks
docker network ls

# Inspect network
docker network inspect bridge

# Test connectivity
docker exec aidevelo ping postgres

# View port mappings
docker port aidevelo
```

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect aidevelo_postgres_data

# Cleanup unused volumes
docker volume prune
```

## 🧹 Cleanup Commands

### Remove Containers
```bash
# Stop and remove all containers
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)

# Remove specific container
docker rm -f aidevelo
```

### Remove Images
```bash
# Remove specific image
docker rmi aidevelo:latest

# Remove all unused images
docker image prune -a

# Remove specific tag
docker rmi ghcr.io/username/aidevelo:old-tag
```

### Complete Cleanup
```bash
# Remove all stopped containers, networks, images, and volumes
docker system prune -a --volumes

# Show disk usage
docker system df
```

## 📊 Monitoring Commands

### Real-time Monitoring
```bash
# View resource usage
docker stats

# View logs (follow)
docker logs -f aidevelo

# View logs (last 100 lines)
docker logs --tail 100 aidevelo

# View logs with timestamps
docker logs -t aidevelo
```

### Health Checks
```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' aidevelo

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' aidevelo
```

## 🔄 CI/CD Integration Commands

### Local Workflow Testing
```bash
# Install act (GitHub Actions locally)
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow locally
act push -W .github/workflows/docker-ci.yml

# Run specific job
act -j build-and-test

# Run with secrets
act push --secret-file .secrets
```

### Cache Management
```bash
# Build with cache export
docker buildx build --cache-to type=local,dest=/tmp/cache .

# Build with cache import
docker buildx build --cache-from type=local,src=/tmp/cache .

# View BuildKit cache
docker buildx du
```

## 📝 Environment Variables

### Common Variables in CI/CD
```bash
# Node environment
NODE_ENV=production

# Application port
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://host:6379

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### Build Arguments
```bash
# Build with custom Node version
docker build --build-arg NODE_VERSION=22 -t aidevelo .

# Build with build date
docker build --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') -t aidevelo .
```

## 🎯 Best Practices

1. **Always use specific tags** - Avoid `:latest` in production
2. **Clean up regularly** - Run `docker system prune` weekly
3. **Monitor image sizes** - Keep images under 500MB when possible
4. **Use health checks** - Define health checks in Dockerfile
5. **Multi-stage builds** - Minimize final image size
6. **Security scanning** - Scan all images before deployment
7. **Version everything** - Tag images with semantic versions

## 🔗 Quick Links

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose Spec](https://docs.docker.com/compose/compose-file/)
- [BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [GitHub Actions Docker](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
