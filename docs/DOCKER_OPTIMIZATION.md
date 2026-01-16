# Dockerfile Optimization Guide

## Current Dockerfile Analysis

Your Dockerfile uses multi-stage builds which is excellent! Here are additional recommendations:

## ✅ Already Implemented

- Multi-stage builds (frontend, backend, production)
- Alpine-based images for smaller size
- npm ci for reproducible builds
- Production-only dependencies in final stage
- Health checks
- Non-root user setup

## 🎯 Recommended Improvements

### 1. Add Build Arguments for Flexibility

```dockerfile
ARG NODE_VERSION=20
ARG NPM_VERSION=10

FROM node:${NODE_VERSION}-alpine AS frontend-builder
```

### 2. Optimize Layer Caching

Order commands from least to most frequently changing:

```dockerfile
# Install system dependencies (rarely changes)
RUN apk add --no-cache curl ca-certificates

# Copy package files (changes occasionally)
COPY package*.json ./

# Install dependencies (changes occasionally)
RUN npm ci --legacy-peer-deps

# Copy source code (changes frequently)
COPY . .
```

### 3. Use .dockerignore More Effectively

Already have one! Consider adding:
```
# .dockerignore additions
**/.git
**/.DS_Store
**/coverage
**/playwright-report
**/test-results
**/*.test.ts
**/*.spec.ts
```

### 4. Security Hardening

```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root
USER nodejs
```

### 5. Use BuildKit Features

Enable in GitHub Actions (already done!):
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
```

### 6. Minimize Final Image

```dockerfile
# Use distroless for maximum security (optional)
FROM gcr.io/distroless/nodejs20-debian12

# Or continue with Alpine but clean up
FROM node:20-alpine
RUN apk del build-dependencies && \
    rm -rf /var/cache/apk/*
```

## 📊 Image Size Optimization

Current approach:
- ✅ Alpine base (~5MB vs Ubuntu ~70MB)
- ✅ Multi-stage (artifacts only, no build tools)
- ✅ Production deps only

Additional techniques:
```dockerfile
# Prune dev dependencies explicitly
RUN npm prune --production

# Remove npm cache
RUN npm cache clean --force

# Remove unnecessary files
RUN rm -rf /tmp/* /root/.npm
```

## 🔒 Security Best Practices

### Scan Images Regularly
Already implemented in `docker-ci.yml` with Trivy!

### Keep Base Images Updated
```yaml
# In GitHub Actions, rebuild weekly
schedule:
  - cron: '0 0 * * 0'  # Every Sunday
```

### Use Specific Versions
```dockerfile
# ✅ Good - pinned version
FROM node:20.11.1-alpine3.19

# ❌ Bad - floating tag
FROM node:20-alpine
```

## 🚀 Build Performance

### Enable BuildKit Cache Mounts
```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps
```

### Parallel Builds
```dockerfile
# Build stages in parallel
FROM base AS frontend-builder
# ...

FROM base AS backend-builder
# ...
```

## 📝 Improved Dockerfile Example

```dockerfile
# syntax=docker/dockerfile:1.4

ARG NODE_VERSION=20
ARG ALPINE_VERSION=3.19

# Base stage with common dependencies
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base
RUN apk add --no-cache \
    curl \
    ca-certificates \
    dumb-init
WORKDIR /app

# Frontend build stage
FROM base AS frontend-builder
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Backend build stage
FROM base AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps
COPY server/ .
RUN npm run build

# Production stage
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION}

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --chown=nodejs:nodejs server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Copy built artifacts
COPY --from=backend-builder --chown=nodejs:nodejs /app/server/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/server/src ./src
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./public

# Switch to non-root user
USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
```

## 🧪 Testing Optimization

Build and test locally:
```bash
# Build with BuildKit
DOCKER_BUILDKIT=1 docker build -t aidevelo:test .

# Check image size
docker images aidevelo:test

# Analyze layers
docker history aidevelo:test

# Use dive for detailed analysis
dive aidevelo:test

# Test the image
docker run --rm -p 5000:5000 aidevelo:test
```

## 📈 Metrics to Track

Monitor in GitHub Actions:
- ✅ Build time (already in workflows)
- ✅ Image size (size-analysis job)
- ✅ Layer count
- ✅ Vulnerability count (Trivy scan)
- ⬜ Cache hit rate
- ⬜ Build success rate

## 🔄 Continuous Improvement

1. **Weekly**: Review security scan results
2. **Monthly**: Check for base image updates
3. **Quarterly**: Analyze build performance trends
4. **Annually**: Consider new Docker features

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Security Scanning](https://docs.docker.com/scout/)
